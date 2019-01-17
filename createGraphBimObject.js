import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_PTR_LST_TYPE
} from "spinal-env-viewer-graph-service";
import SpinalBIMObject from "spinal-models-bimobject";

const BIM_OBJECT_CONTEXT_TYPE = "BIMObjectContext";
const BIM_OBJECT_NODE_TYPE = "BIMObject";
const BIM_OBJECT_RELATION_NAME = "hasBIMObject";
const REFERENCE_OBJECT_RELATION_NAME = "hasReferenceObject";
const BIM_OBJECT_RELATION_TYPE = SPINAL_RELATION_PTR_LST_TYPE;

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

const bimObjectService = {
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
    let BIMObjNode = await this.getBIMObject(dbid);

    if (BIMObjNode === undefined) {
      const BIMObject = new SpinalBIMObject(dbid, name);

      BIMObjNode = new SpinalNode(name, BIM_OBJECT_NODE_TYPE, BIMObject);
      BIMObjNode.info.add_attr({
        dbid: dbid
      });

      const BIMObjectContext = await this.getContext();

      await BIMObjectContext.addChildInContext(
        BIMObjNode,
        BIM_OBJECT_RELATION_NAME,
        BIM_OBJECT_RELATION_TYPE,
        BIMObjectContext
      );
    }

    return BIMObjNode;
  },
  async getBIMObject(dbid) {
    const BIMObjectContext = await this.getContext(BIM_OBJECT_CONTEXT_TYPE);
    const BIMObjectArray = await BIMObjectContext.getChildren([
      BIM_OBJECT_RELATION_NAME
    ]);

    for (let BIMObject of BIMObjectArray) {
      if (BIMObject.info.dbid.get() === dbid) {
        return BIMObject;
      }
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
      BIM_OBJECT_RELATION_TYPE,
      context
    );

    return node;
  },
  removeBIMObject(parent, child) {
    return parent.removeChild(
      child,
      BIM_OBJECT_RELATION_NAME,
      BIM_OBJECT_RELATION_TYPE
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
  async addReferenceObject(parent, dbId, name) {
    let node;

    if (dbId instanceof SpinalNode) {
      node = dbId;
    } else {
      node = await this.getBIMObject(dbId);

      if (node === undefined) {
        node = await this.createBIMObject(dbId, name);
      }
    }

    await parent.addChild(
      node,
      REFERENCE_OBJECT_RELATION_NAME,
      BIM_OBJECT_RELATION_TYPE
    );

    return node;
  },
  removeReferenceObject(parent, child) {
    return parent.removeChild(
      child,
      REFERENCE_OBJECT_RELATION_NAME,
      BIM_OBJECT_RELATION_TYPE
    );
  }
};

bimObjectService.constants = {
  BIM_OBJECT_CONTEXT_TYPE,
  BIM_OBJECT_NODE_TYPE,
  BIM_OBJECT_RELATION_NAME,
  REFERENCE_OBJECT_RELATION_NAME,
  BIM_OBJECT_RELATION_TYPE
};

export default bimObjectService;
