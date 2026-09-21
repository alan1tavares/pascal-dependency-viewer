import { DataSet } from "vis-data";
import { Network } from "vis-network";

const ORIGIN_INTERFACE = "interface";
const ORIGIN_IMPLEMENTATION = "implementation";
const ORIGIN_BOTH = "both";
const MAX_INITIAL_SCALE = 1;
const FIT_MARGIN = 1.1;

export function renderGraph(nodesData, edgesData, rootUnitId) {
  document.getElementById("rootUnitSelection").style.display = "none";
  const container = document.getElementById("mynetwork");
  container.style.display = "block";
  document.getElementById("viewFilterPanel").style.display = "block";

  const edgeOriginById = new Map();
  const edgesWithId = edgesData.map((edge) => {
    const id = `${edge.from}::${edge.to}`;
    edgeOriginById.set(id, edge.origin);
    return { id, from: edge.from, to: edge.to };
  });

  const nodes = new DataSet(
    nodesData.map((node) =>
      node.id === rootUnitId ? { ...node, group: "rootUnit" } : node,
    ),
  );
  const edges = new DataSet(edgesWithId);
  const data = { nodes, edges };

  const arrows = "to";
  const groups = {
    rootUnit: {
      shape: "ellipse",
      color: { background: "#FFB74D", border: "#E65100" },
      borderWidth: 2,
      margin: 14,
      font: { size: 22, mod: "bold" },
    },
    projectUnit: { shape: "ellipse", color: "#97C2FC" },
    externalUnit: { shape: "box", color: "#D3D3D3" },
  };
  const physics = {
    solver: "forceAtlas2Based",
    // forceAtlas2Based: {
    //   gravitationalConstant: -80,
    //   centralGravity: 0.05,
    //   springLength: 150,
    //   springConstant: 0.05,
    //   damping: 0.4,
    //   timestep: 0.2,
    // },
    forceAtlas2Based: {
      //   theta: 0.5,
      gravitationalConstant: -50,
      centralGravity: 0.01,
      springConstant: 0.08,
      springLength: 400,
      damping: 0.4,
      //   avoidOverlap: 0,
    },
    // minVelocity: 3,
    // maxVelocity: 15,
    // stabilization: { iterations: 1000 },
    minVelocity: 0.75,
  };
  const options = {
    edges: { arrows, smooth: { forcedirection: "none" } },
    groups,
    physics,
  };
  const network = new Network(container, data, options);

  network.once("stabilizationIterationsDone", () => {
    centerOnRootUnit(network, container, nodes, rootUnitId);
  });

  setUpViewFilter({ nodes, edges, nodesData, edgeOriginById, rootUnitId });
}

function centerOnRootUnit(network, container, nodes, rootUnitId) {
  const root = network.getPosition(rootUnitId);
  let halfWidth = 0;
  let halfHeight = 0;
  nodes.forEach((node) => {
    if (node.hidden) {
      return;
    }
    const box = network.getBoundingBox(node.id);
    halfWidth = Math.max(
      halfWidth,
      Math.abs(box.left - root.x),
      Math.abs(box.right - root.x),
    );
    halfHeight = Math.max(
      halfHeight,
      Math.abs(box.top - root.y),
      Math.abs(box.bottom - root.y),
    );
  });
  const scale = Math.min(
    MAX_INITIAL_SCALE,
    container.clientWidth / (2 * halfWidth * FIT_MARGIN),
    container.clientHeight / (2 * halfHeight * FIT_MARGIN),
  );
  network.moveTo({ position: root, scale });
}

function setUpViewFilter({
  nodes,
  edges,
  nodesData,
  edgeOriginById,
  rootUnitId,
}) {
  const interfaceCheckbox = document.getElementById("viewFilterInterface");
  const implementationCheckbox = document.getElementById(
    "viewFilterImplementation",
  );
  const externalCheckbox = document.getElementById("viewFilterExternal");
  interfaceCheckbox.checked = true;
  implementationCheckbox.checked = true;
  externalCheckbox.checked = false;

  const nodeGroupById = new Map(nodesData.map((node) => [node.id, node.group]));

  function isOriginVisible(origin) {
    if (origin === ORIGIN_BOTH) {
      return interfaceCheckbox.checked || implementationCheckbox.checked;
    }
    if (origin === ORIGIN_INTERFACE) {
      return interfaceCheckbox.checked;
    }
    return implementationCheckbox.checked;
  }

  function isEdgeVisible(id, origin) {
    if (!isOriginVisible(origin)) {
      return false;
    }
    const [, to] = id.split("::");
    if (nodeGroupById.get(to) === "externalUnit" && !externalCheckbox.checked) {
      return false;
    }
    return true;
  }

  function applyViewFilter() {
    const visibleNodeIds = new Set([rootUnitId]);

    const edgeUpdates = Array.from(edgeOriginById, ([id, origin]) => {
      const visible = isEdgeVisible(id, origin);
      if (visible) {
        const [from, to] = id.split("::");
        visibleNodeIds.add(from);
        visibleNodeIds.add(to);
      }
      return { id, hidden: !visible, physics: visible };
    });
    edges.update(edgeUpdates);

    const nodeUpdates = nodesData.map((node) => ({
      id: node.id,
      hidden: !visibleNodeIds.has(node.id),
      physics: visibleNodeIds.has(node.id),
    }));
    nodes.update(nodeUpdates);
  }

  function handleCheckboxChange(event) {
    if (!interfaceCheckbox.checked && !implementationCheckbox.checked) {
      event.target.checked = true;
      return;
    }
    applyViewFilter();
  }

  interfaceCheckbox.onchange = handleCheckboxChange;
  implementationCheckbox.onchange = handleCheckboxChange;
  externalCheckbox.onchange = applyViewFilter;

  applyViewFilter();
}
