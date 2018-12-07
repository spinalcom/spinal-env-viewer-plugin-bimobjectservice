import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalContext,
  SpinalGraphService,
  SpinalNode,
} from 'spinal-env-viewer-graph-service';
import SpinalBIMObject from 'spinal-models-bimobject';

let bimObjectService = {
  graph: null,
  context: null,
  getGraph() {
    if (this.graph === null) {
      this.graph = SpinalGraphService.getGraph();
    }

    return this.graph;
  },

  getContext() {
    if (this.context === null) {
      this.context = SpinalGraphService.getContext( 'BIMObjectContext' );

      if (typeof this.context === 'undefined') {
        this.context = new SpinalGraphService.addContext('BIMObjectContext');
      }
    }
    return this.context;
  },

  async createBIMObject( dbid, name ) {
    let myBIMObjNode = await this.getBIMObject( dbid );
    if (myBIMObjNode == undefined) {
      let myBIMObj = new SpinalBIMObject( dbid, name );
      myBIMObjNode = SpinalGraphService.createNode({ name, type: 'BIMObject', dbid}, myBIMObj );

      let BIMObjectContext = await this.getContext();

      await SpinalGraphService.addChildInContext(
        BIMObjectContext.
        myBIMObjNode,
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE,
        BIMObjectContext
      );

      return myBIMObjNode;
    } else {
      return myBIMObjNode;
    }

  },
  async getBIMObject( dbid ) {
    let BIMObjectContext =  this.getContext(  );

      let BIMObjectArray = await BIMObjectContext.getChildren( [
        'hasBIMObject',
      ] );

      for (let i = 0; i < BIMObjectArray.length; i++) {
        const element = BIMObjectArray[i];
        if (element.info.dbid.get() === dbid) {
          return element;
        }
      }

  },
  async addBIMObject( context, node, dbid, name ) {
    if (dbid instanceof SpinalNode) {
      await SpinalGraphService.addChildInContext(
        node.id.get(),
        dbid.getId().get(),
        context.id.get(),
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE );
      return dbid;
    } else {
      let myBIMObjNode = await this.getBIMObject( dbid );

      if (typeof myBIMObjNode === "undefined") {
        let myBIMObjNode = await this.createBIMObject( dbid, name );
      }

      let childrenIds = SpinalGraphService.getRealNode( node.id.get() ).getChildrenIds();

      if (!childrenIds.includes( myBIMObjNode.getId().get() )) {
        await SpinalGraphService.addChildInContext(
          node.id.get(),
          myBIMObjNode.getId().get(),
          context.id.get(),
          'hasBIMObject',
          SPINAL_RELATION_PTR_LST_TYPE,
        );
      }
      return myBIMObjNode;
    }
  },
};

export default bimObjectService;