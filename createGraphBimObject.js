import {
  SpinalGraph,
  SpinalContext,
  SpinalNode,
  SPINAL_RELATION_LST_PTR_TYPE
}
from 'spinalgraph';
import SpinalBIMObject from 'spinal-models-bimobject'
import {
  resolve
} from 'url';
import {
  promises
} from 'fs';

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
    let myBIMObjNode = new SpinalNode("BIMObject", "BIMObject", myBIMObj);
    myBIMObjNode.info.add_attr({
      dbid: dbid
    })
    // console.log(myBIMObjNode);

    let BIMObjectContext = await myGraph.getContext("BIMObject");
    // console.log(BIMObjectContext);
    if (BIMObjectContext != undefined) {
      BIMObjectContext.addChildInContext(myBIMObjNode, "hasBIMObject",
        SPINAL_RELATION_LST_PTR_TYPE, BIMObjectContext)
    } else {
      let myContext = new SpinalContext("BIMObject");
      myGraph.addContext(myContext);
      myContext.addRelationName("hasBIMObject");
      myContext.addChildInContext(myBIMObjNode, "hasBIMObject",
        SPINAL_RELATION_LST_PTR_TYPE, BIMObjectContext)

    }
    // myGraph.BIMObjects.push(myBIMObjNode);
    return myBIMObjNode;
  },

  "getBIMObject": async function getBIMObject(dbid) {

    let myGraph = await bimObjectService.getGraph();
    let BIMObjectContext = await myGraph.getContext("BIMObject");
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
    // if (myGraph.BIMObjects.length != 0) {
    //   for (let i = 0; i < myGraph.BIMObjects.length; i++) {
    //     const myBIMObject = myGraph.BIMObjects[i];
    //     if (dbid === myBIMObject.info.dbid.get()) {}
    //   }
    // } else {
    //   return null;
    // }
  }
}
module.exports = bimObjectService;