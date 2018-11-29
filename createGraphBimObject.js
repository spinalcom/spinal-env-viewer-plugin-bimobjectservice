import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_PTR_LST_TYPE,
} from 'spinalgraph';
import SpinalBIMObject from 'spinal-models-bimobject';

let bimObjectService = {
  graph: null,
  context: null,
  async getGraph() {
    if (this.graph === null) {
      let forgeFile = await window.spinal.spinalSystem.getModel();

      if (!forgeFile.hasOwnProperty('graph')) {
        forgeFile.add_attr({
          graph: new SpinalGraph(),
        });
      }
      this.graph = forgeFile.graph;
    }
    return this.graph;
  },
  async getContext() {
    if (this.context === null) {
      let graph = await this.getGraph();
      this.context = await graph.getContext('BIMObjectContext');

      if (typeof this.context === 'undefined') {
        this.context = new SpinalContext('BIMObjectContext');
        graph.addContext(this.context);
      }
    }
    return this.context;
  },
  async createBIMObject(dbid, name) {
    let myBIMObjNode = await this.getBIMObject(dbid);
    if (myBIMObjNode == undefined) {
      let myBIMObj = new SpinalBIMObject(dbid, name);
      myBIMObjNode = new SpinalNode(name, 'BIMObject', myBIMObj);
      myBIMObjNode.info.add_attr({
        dbid: dbid,
      });

      let BIMObjectContext = await this.getContext();

      await BIMObjectContext.addChildInContext(
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
  async getBIMObject(dbid) {
    let BIMObjectContext = await this.getContext('BIMObjectContext');

    if (typeof BIMObjectContext !== 'undefined') {
      let BIMObjectArray = await BIMObjectContext.getChildren([
        'hasBIMObject',
      ]);

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
      await node.addChildInContext(
        dbid,
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE,
        context
      );
      return dbid;
    } else {
      let myBIMObjNode = await this.getBIMObject(dbid);
      if (typeof myBIMObjNode !== 'undefined') {
        await node.addChildInContext(
          myBIMObjNode,
          'hasBIMObject',
          SPINAL_RELATION_PTR_LST_TYPE,
          context
        );
        return myBIMObjNode;
      } else {
        let myBIMObjNode = await this.createBIMObject(dbid, name);

        await node.addChildInContext(
          myBIMObjNode,
          'hasBIMObject',
          SPINAL_RELATION_PTR_LST_TYPE,
          context
        );
        return myBIMObjNode;
      }
    }
  },
};

export default bimObjectService;
