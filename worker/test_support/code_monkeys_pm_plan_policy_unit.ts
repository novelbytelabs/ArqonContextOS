declare const process: { exitCode?: number };
import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";
function assert(c:boolean,m:string):void{if(!c)throw new Error(m)}
try{assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("plan"),"code_flow allows plan");assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("plan")===true,"PM_AI writes plan");assert(validateFlowArtifactRole("code_flow","CODER_AI","plan")!==null,"CODER denied plan");assert(validateFlowArtifactRole("code_flow","HELPER_AI","plan")!==null,"HELPER denied plan");assert(validateFlowArtifactRole("science_flow","PM_AI","plan")!==null,"PM plan not science artifact");console.log(JSON.stringify({ok:true,result:"PASS"},null,2));}catch(e){console.error(e);process.exitCode=1;}
