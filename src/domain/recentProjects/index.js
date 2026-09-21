export const MAX_RECENT_PROJECTS = 10;

export function addRecentProject(list, path, max = MAX_RECENT_PROJECTS) {
  return [path, ...list.filter((item) => item !== path)].slice(0, max);
}

export function removeRecentProject(list, path) {
  return list.filter((item) => item !== path);
}

export function describeRecentProject(path) {
  const separatorIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return {
    fileName: path.slice(separatorIndex + 1),
    dir: separatorIndex === -1 ? "" : path.slice(0, separatorIndex),
  };
}

export function filterRecentProjects(paths, text) {
  const needle = text.toLowerCase();
  return paths.filter((path) => {
    const { fileName } = describeRecentProject(path);
    return (
      fileName.toLowerCase().includes(needle) ||
      path.toLowerCase().includes(needle)
    );
  });
}
