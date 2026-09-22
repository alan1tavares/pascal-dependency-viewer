export function filterProjectUnits(projectUnits, text) {
  const needle = text.toLowerCase();
  return projectUnits.filter(
    (projectUnit) =>
      projectUnit.unitName.toLowerCase().includes(needle) ||
      projectUnit.path.toLowerCase().includes(needle)
  );
}
