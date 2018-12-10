import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService,
  SpinalNode,
} from 'spinal-env-viewer-graph-service';

import SpinalBIMObject from 'spinal-models-bimobject';

let bimObjectService = {
  graph: null,
  context: null,
  getGraph() {
    console.log("GET GRAPH")
    if (this.graph === null) {
      this.graph = SpinalGraphService.getGraph();
    }
    console.log(this.graph)
    return this.graph;
  },
  async getContext() {
    console.log("GET CONTEXT")
    if (this.context === null) {
      this.context = await SpinalGraphService.getContext('BIMObjectContext');
      if (typeof this.context === 'undefined') {
        this.context = await SpinalGraphService.addContext(
          'BIMObjectContext');
        console.log(this.context);
        return this.context
      }
      return this.context
    }
    return this.context;
  },

  async createBIMObject(dbid, name) {
    let myBIMObjNode = await this.getBIMObject(dbid);
    console.log("CREATE BIM OBJECT")
    console.log("ici le bim object n'est pas créer")
    if (typeof myBIMObjNode === 'undefined') {
      let myBIMObj = new SpinalBIMObject(dbid, name);
      myBIMObjNode = SpinalGraphService.createNode({
          name,
          type: 'BIMObject',
          dbid,
        },
        myBIMObj
      );
      console.log("ici ce trouve l'id du node créer par le service graph")
      console.log(myBIMObjNode);
      let BIMObjectContext = await this.getContext();
      console.log(BIMObjectContext)
      await SpinalGraphService.addChildInContext(
        BIMObjectContext.info.id.get(),
        myBIMObjNode,
        BIMObjectContext.info.id.get(),
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE
      );

      myBIMObjNode = SpinalGraphService.getRealNode(myBIMObjNode);
    }

    return myBIMObjNode;
  },
  async getBIMObject(dbid) {
    let BIMObjectContext = await this.getContext();
    console.log("GET BIM OBJECT")
    console.log("ici le context exist")
    if (BIMObjectContext != undefined) {
      let BIMObjectArray = await BIMObjectContext.getChildren([
        'hasBIMObject',
      ]);
      console.log(BIMObjectArray)
      for (let i = 0; i < BIMObjectArray.length; i++) {
        const element = BIMObjectArray[i];
        if (element.info.dbid.get() === dbid) {
          return element;
        }
      }
    } else {
      return undefined;
    }
  },
  async addBIMObject(context, node, dbid, name) {
    if (dbid instanceof SpinalNode) {
      await SpinalGraphService.addChildInContext(
        node.id.get(),
        dbid.getId().get(),
        context.id.get(),
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE
      );
      return dbid;
    } else {
      let myBIMObjNode = await this.getBIMObject(dbid);

      if (typeof myBIMObjNode === 'undefined') {
        myBIMObjNode = await this.createBIMObject(dbid, name);
      }

      let childrenIds = SpinalGraphService.getRealNode(
        node.id.get()
      ).getChildrenIds();

      if (!childrenIds.includes(myBIMObjNode.getId().get())) {
        await SpinalGraphService.addChildInContext(
          node.id.get(),
          myBIMObjNode.getId().get(),
          context.id.get(),
          'hasBIMObject',
          SPINAL_RELATION_PTR_LST_TYPE
        );
      }
      return myBIMObjNode;
    }
  },
};

export default bimObjectService;