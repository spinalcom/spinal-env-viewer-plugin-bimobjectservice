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

    return Promise.resolve( this.graph );
  },
  async getContext() {
    if (this.context === null) {
      let graph = await this.getGraph();
      this.context = graph.getContext( 'BIMObjectContext' );

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
      await SpinalGraphService.getRealNode( node.id.get() ).addChildInContext(
        dbid,
        'hasBIMObject',
        SPINAL_RELATION_PTR_LST_TYPE,
        SpinalGraphService.getRealNode( context.id.get() )
      );
      return dbid;
    } else {
      let myBIMObjNode = await this.getBIMObject(dbid);
      if (typeof myBIMObjNode !== 'undefined') {
        let childrenIds = SpinalGraphService.getRealNode( node.id.get() ).getChildrenIds();

        if (!childrenIds.includes(myBIMObjNode.getId().get())) {
          await SpinalGraphService.getRealNode( node.id.get() ).addChildInContext(
            myBIMObjNode,
            'hasBIMObject',
            SPINAL_RELATION_PTR_LST_TYPE,
            SpinalGraphService.getRealNode( context.id.get() )
          );
        }
        return myBIMObjNode;
      } else {
        let myBIMObjNode = await this.createBIMObject(dbid, name);

        await SpinalGraphService.getRealNode( node.id.get() ).addChildInContext(
          myBIMObjNode,
          'hasBIMObject',
          SPINAL_RELATION_PTR_LST_TYPE,
          SpinalGraphService.getRealNode( context.id.get() )
        );
        return myBIMObjNode;
      }
    }
  },
};

export default bimObjectService;