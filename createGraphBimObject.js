import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_PTR_LST_TYPE
} from "spinal-model-graph";
import SpinalBIMObject from "spinal-models-bimobject";

const BIM_OBJECT_CONTEXT_TYPE = "BIMObjectContext";
const BIM_OBJECT_NODE_TYPE = "BIMObject";
const BIM_OBJECT_RELATION_NAME = "hasBIMObject";
const REFERENCE_OBJECT_RELATION_NAME = "hasReferenceObject";

async function createGraph() {
  const forgeFile = await window.spinal.spinalSystem.getModel();

  if (!forgeFile.hasOwnProperty("graph")) {
    forgeFile.add_attr({
      graph: new SpinalGraph()
    });
  }

  return forgeFile.graph;
}

async function createContext() {
  const graph = await this.getGraph();
  let context = await graph.getContext(BIM_OBJECT_CONTEXT_TYPE);

  if (context === undefined) {
    context = new SpinalContext(BIM_OBJECT_CONTEXT_TYPE);
    await graph.addContext(context);
  }

  return context;
}

let bimObjectService = {
  graph: null,
  context: null,
  getGraph() {
    if (this.graph === null) {
      this.graph = createGraph();
    }

    return this.graph;
  },
  getContext() {
    if (this.context === null) {
      this.context = createContext.call(this);
    }

    return this.context;
  },
  async createBIMObject(dbid, name) {
    let myBIMObjNode = await this.getBIMObject(dbid);
    if (myBIMObjNode == undefined) {
      let myBIMObj = new SpinalBIMObject(dbid, name);
      myBIMObjNode = new SpinalNode(name, BIM_OBJECT_NODE_TYPE, myBIMObj);
      myBIMObjNode.info.add_attr({
        dbid: dbid
      });

      let BIMObjectContext = await this.getContext();

      await BIMObjectContext.addChildInContext(
        myBIMObjNode,
        BIM_OBJECT_RELATION_NAME,
        SPINAL_RELATION_PTR_LST_TYPE,
        BIMObjectContext
      );

      return myBIMObjNode;
    } else {
      return myBIMObjNode;
    }
  },
  async getBIMObject(dbid) {
    let BIMObjectContext = await this.getContext(BIM_OBJECT_CONTEXT_TYPE);

    if (typeof BIMObjectContext !== "undefined") {
      let BIMObjectArray = await BIMObjectContext.getChildren([BIM_OBJECT_RELATION_NAME]);

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
  async addBIMObject(context, parent, dbId, name) {
    let node;

    if (dbId instanceof SpinalNode) {
      node = dbId;
    } else {
      node = await this.getBIMObject(dbId);

      if (node === undefined) {
        node = await this.createBIMObject(dbId, name);
      }
    }

    await parent.addChildInContext(
      node,
      BIM_OBJECT_RELATION_NAME,
      SPINAL_RELATION_PTR_LST_TYPE,
      context
    );

    return node;
  },
  removeBIMObject(parent, child) {
    return parent.removeChild(
      child,
      BIM_OBJECT_RELATION_NAME,
      SPINAL_RELATION_PTR_LST_TYPE
    );
  },
  async deleteBIMObject(dbId) {
    const context = await this.getContext();
    const children = await context.getChildrenInContext();
    const child = children.find(node => node.info.dbId === dbId);

    if (child === undefined) {
      throw Error("The dbId has no BIM object");
    }

    return child.removeFromGraph();
  },
  async addReferenceObject(context, parent, dbId, name) {
    let node;

    if (dbId instanceof SpinalNode) {
      node = dbId;
    } else {
      node = await this.getBIMObject(dbId);

      if (node === undefined) {
        node = await this.createBIMObject(dbId, name);
      }
    }

    await parent.addChildInContext(
      node,
      REFERENCE_OBJECT_RELATION_NAME,
      SPINAL_RELATION_PTR_LST_TYPE,
      context
    );

    return node;
  },
  removeReferenceObject(parent, child) {
    return parent.removeChild(
      child,
      REFERENCE_OBJECT_RELATION_NAME,
      SPINAL_RELATION_PTR_LST_TYPE
    );
  },
};

export default bimObjectService;
