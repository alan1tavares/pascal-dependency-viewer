export async function runCommand(id, { webContents, performOpenProject }) {
  switch (id) {
    case "openProject": {
      const project = await performOpenProject();
      if (project) webContents.send("app:project-loaded", project);
      break;
    }
    case "selectUnit":
      webContents.send("app:show-root-unit-selection");
      break;
    case "openRecent":
      webContents.send("app:show-open-recent");
      break;
  }
}
