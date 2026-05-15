export {};
import { ROLE_FLOW_ARTIFACTS, FLOW_ARTIFACT_SLOTS } from "../src/flow_policy.js";
function assert(c:boolean,m:string){ if(!c) throw new Error(m); }
assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("helper_execution_intake"), "code_flow slot missing");
assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("helper_execution_intake") === true, "HELPER ownership missing");
assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("helper_execution_intake") !== true, "CODER must not own helper intake");
assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("helper_execution_intake") !== true, "PM must not own helper intake");
console.log(JSON.stringify({ok:true,result:"PASS"}, null, 2));
