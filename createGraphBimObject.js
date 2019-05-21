import {
  SpinalNode,
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService
} from "spinal-env-viewer-graph-service";
import SpinalBIMObject from "spinal-models-bimobject";
import { assemblyManagerService } from "spinal-service-assembly-manager";

const BIM_OBJECT_CONTEXT_TYPE = "BIMObjectContext";
const BIM_OBJECT_NODE_TYPE = "BIMObject";
const BIM_OBJECT_RELATION_NAME = "hasBIMObject";
const REFERENCE_OBJECT_RELATION_NAME = "hasReferenceObject";
const BIM_OBJECT_RELATION_TYPE = SPINAL_RELATION_PTR_LST_TYPE;

const assemblyManger =  assemblyManagerService;
const bimObjectService = {
  createBIMObject(dbid, name) {
    return assemblyManger.createBimObj(dbid, name, AssemblyManagerService._getCurrentModel())
  },
  
  getBIMObject(dbid) {
    console.log('getBimObject', dbid);
    return assemblyManger.getBimObjectFromViewer(dbid, AssemblyManagerService._getCurrentModel())
      .then(bimObj => {
        if (bimObj) {
          console.log( 'bimObj', bimObj);
          return SpinalGraphService.getRealNode(bimObj.id);
        }
        return undefined;
      });
  },
  
  addBIMObject(context, parent, dbId, name) {
    console.log('add to parent')
    return this.getBIMObject(dbId)
      .then(bimObject => {
        console.log('then get bim object',bimObject);
        if (bimObject) {
          return SpinalGraphService.addChildInContext(
            parent.info.id.get(), bimObject.info.id.get(), context.info.id.get()
            , BIM_OBJECT_RELATION_NAME, BIM_OBJECT_RELATION_TYPE,
          )
        }
        return assemblyManger.createBimObj(dbId, name, AssemblyManagerService._getCurrentModel())
          .then(
            (bimObj) => {
              console.log('create then',bimObj);
              return this.addBIMObject(context, parent, dbId, name);
            }
          )
      }).catch(e => {console.error(e)})
  },
  
  removeBIMObject(parent, child) {
    SpinalGraphService.removeChild(
      parent.info.id.get(),
      child.info.id.get(),
      BIM_OBJECT_RELATION_NAME,
      BIM_OBJECT_RELATION_TYPE
    );
  },
  
  deleteBIMObject(dbId) {
    return this.getBIMObject(dbId).then(
      (BIMobj) => {
        if (BIMobj)
          return SpinalGraphService.removeFromGraph(BIMobj.info.id.get());
        // @ts-ignore
        throw Error("The dbId has no BIM object");
      }
    )
    
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
    
    SpinalGraphService
      .addChild(parent.info.id.get(), node.info.id.get(),
        REFERENCE_OBJECT_RELATION_NAME,
        BIM_OBJECT_RELATION_TYPE);
    return node;
  },
  
  removeReferenceObject(parent, child) {
    return this.removeBIMObject(parent, child)
  },
};

bimObjectService.constants = {
  BIM_OBJECT_CONTEXT_TYPE,
  BIM_OBJECT_NODE_TYPE,
  BIM_OBJECT_RELATION_NAME,
  REFERENCE_OBJECT_RELATION_NAME,
  BIM_OBJECT_RELATION_TYPE
};

export default bimObjectService;
