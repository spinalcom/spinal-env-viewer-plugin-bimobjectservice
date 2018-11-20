import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_LST_PTR_TYPE
}
from 'spinalgraph';
import SpinalBIMObject from 'spinal-models-bimobject'


let bimObjectService = {
  "getGraph": async function getGraph() {
    return window.spinal.spinalSystem
      .getModel()
      .then(forgeFile => {
        if (!forgeFile.hasOwnProperty("graph")) {
          forgeFile.add_attr({
            graph: new SpinalGraph()
          });
        }
        return forgeFile.graph;
      });
  },
  "createBIMObject": async function createBIMObject(dbid, name) {
    let myGraph = await bimObjectService.getGraph();
    let myBIMObj = new SpinalBIMObject(dbid, name);
    // console.log(SPINAL_RELATION_LST_PTR_TYPE)
    let myBIMObjNode = new SpinalNode(name, "BIMObject", myBIMObj);
    myBIMObjNode.info.add_attr({
      dbid: dbid
    })
    // console.log(myBIMObjNode);

    let BIMObjectContext = await myGraph.getContext("BIMObjectContext");
    // console.log(BIMObjectContext);
    if (BIMObjectContext != undefined) {
      BIMObjectContext.addChildInContext(myBIMObjNode, "hasBIMObject",
        SPINAL_RELATION_LST_PTR_TYPE, BIMObjectContext)
    } else {
      let myContext = new SpinalContext("BIMObjectContext");
      myGraph.addContext(myContext);
      console.log(myContext);
      myContext.addRelationName("hasBIMObject");
      myContext.addChildInContext(myBIMObjNode, "hasBIMObject",
        SPINAL_RELATION_LST_PTR_TYPE, BIMObjectContext)

    }
    // myGraph.BIMObjects.push(myBIMObjNode);
    return myBIMObjNode;
  },

  "getBIMObject": async function getBIMObject(dbid) {

    let myGraph = await bimObjectService.getGraph();
    let BIMObjectContext = await myGraph.getContext("BIMObjectContext");
    console.log(BIMObjectContext)
    if (BIMObjectContext != undefined) {
      let BIMObjectArray = await BIMObjectContext.getChildren([
        "hasBIMObject"
      ])
      console.log(BIMObjectArray)
      for (let i = 0; i < BIMObjectArray.length; i++) {
        const element = BIMObjectArray[i];
        if (element.info.dbid.get() == dbid) {
          console.log(element)
          return element
        }
      }
    } else {
      return undefined;
    }
  },
  "addBIMObject": async function addBIMObject(context, node, dbid, name) {
    console.log(context)
    console.log(node)
    console.log(dbid)
    if (dbid instanceof SpinalNode) {
      node.addChildInContext(dbid, "hasBIMObject",
      SPINAL_RELATION_LST_PTR_TYPE, context)
      return dbid;
    } else {
      let myBIMObjNode = await bimObjectService.getBIMObject(dbid);
      if (myBIMObjNode != undefined){
        node.addChildInContext(myBIMObjNode, "hasBIMObject",
        SPINAL_RELATION_LST_PTR_TYPE, context)
        return myBIMObjNode;
      } else {
    let myGraph = await bimObjectService.getGraph();
    let BIMObjectContext = await myGraph.getContext("BIMObjectContext");
        if (BIMObjectContext == undefined) {
          let myGraph = await bimObjectService.getGraph();
          let myContext = new SpinalContext("BIMObjectContext");
        myGraph.addContext(myContext);
      console.log(myContext);

        }
   
        let myBIMObjNode = await bimObjectService.createBIMObject(dbid, name);
        node.addChildInContext(myBIMObjNode, "hasBIMObject", SPINAL_RELATION_LST_PTR_TYPE, context)
        return myBIMObjNode;
      }
    }
  }
}
module.exports = bimObjectService;
