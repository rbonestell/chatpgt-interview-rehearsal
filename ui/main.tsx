import { createRoot } from "react-dom/client";
import { createBridge } from "./bridge.js";
import { WorkspaceController } from "./controller.js";
import { Workspace } from "./Workspace.js";

const bridge = createBridge();
const controller = new WorkspaceController(bridge, window.openai?.widgetState);
createRoot(document.getElementById("root")!).render(<Workspace controller={controller}/>);
void bridge.connect(controller);
