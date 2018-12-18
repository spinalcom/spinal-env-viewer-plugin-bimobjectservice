import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_PTR_LST_TYPE
} from "spinal-model-graph";
import SpinalBIMObject from "spinal-models-bimobject";

async function createGraph() {
  let forgeFile = await window.spinal.spinalSystem.getModel();

  if (!forgeFile.hasOwnProperty("graph")) {
    forgeFile.add_attr({
      graph: new SpinalGraph()
    });
  }

  return forgeFile.graph;
}

async function createContext() {
  const graph = await this.getGraph();
  let context = await graph.getContext("BIMObjectContext");

  if (context === undefined) {
    context = new SpinalContext("BIMObjectContext");
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
      myBIMObjNode = new SpinalNode(name, "BIMObject", myBIMObj);
      myBIMObjNode.info.add_attr({
        dbid: dbid
      });

      let BIMObjectContext = await this.getContext();

      await BIMObjectContext.addChildInContext(
        myBIMObjNode,
        "hasBIMObject",
        SPINAL_RELATION_PTR_LST_TYPE,
        BIMObjectContext
      );

      return myBIMObjNode;
    } else {
      return myBIMObjNode;
    }
  },
  async getBIMObject(dbid) {
    let BIMObjectContext = await this.getContext("BIMObjectContext");

    if (typeof BIMObjectContext !== "undefined") {
      let BIMObjectArray = await BIMObjectContext.getChildren(["hasBIMObject"]);

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
      "hasBIMObject",
      SPINAL_RELATION_PTR_LST_TYPE,
      context
    );

    return node;
  },
  removeBIMObject(parent, child) {
    return parent.removeChild(
      child,
      "hasBIMObject",
      SPINAL_RELATION_PTR_LST_TYPE
    );
  },
  async deleteBIMObject(dbId) {
    const context = await this.getContext();
    const children = await context.getChildrenInContext();
    const child = children.find(node => node.info.dbId === dbId);

    if (child === undefined) {
      throw Error("The dbId as no BIM object");
    }

    return child.removeFromGraph();
  }
};

export default bimObjectService;
