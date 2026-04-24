export async function POST(req) {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const body = await req.json();
    const data = body.data || [];

    const invalid_entries = [];
    const validEdges = [];
    
    // 1. Validation
    for (const item of data) {
      // Rule: trim whitespace first, then validate
      const entry = typeof item === 'string' ? item.trim() : String(item).trim();
      
      if (!/^[A-Z]->[A-Z]$/.test(entry)) {
        invalid_entries.push(entry);
        continue;
      }
      
      const [parent, child] = entry.split('->');
      // Check for self loops
      if (parent === child) {
        invalid_entries.push(entry);
        continue;
      }

      validEdges.push(entry);
    }

    // 2. Duplicate Edges processing
    const seenEdges = new Set();
    const duplicateEdgesSet = new Set();
    const duplicate_edges = [];
    const uniqueEdges = []; // First occurrences only for tree building

    for (const edge of validEdges) {
      if (seenEdges.has(edge)) {
        if (!duplicateEdgesSet.has(edge)) {
          duplicateEdgesSet.add(edge);
          duplicate_edges.push(edge);
        }
      } else {
        seenEdges.add(edge);
        uniqueEdges.push(edge);
      }
    }

    // 3. Tree Construction (handle multi-parent by accepting first encountered silently)
    const parentOf = {};
    const childrenOf = {};
    const allNodes = new Set();
    
    for (const edge of uniqueEdges) {
      const [parent, child] = edge.split('->');
      allNodes.add(parent);
      allNodes.add(child);
      
      if (parentOf[child]) {
        // Node already has a parent, discard second silently
        continue; 
      }
      
      parentOf[child] = parent;
      if (!childrenOf[parent]) {
        childrenOf[parent] = [];
      }
      childrenOf[parent].push(child);
    }
    
    // Sort children for predictable JSON structure (optional but nicely matches examples)
    for (const parent in childrenOf) {
      childrenOf[parent].sort();
    }

    // 4. Find roots (nodes strictly with no parent)
    const roots = [];
    for (const node of allNodes) {
      if (!parentOf[node]) {
        roots.push(node);
      }
    }
    
    // 5. Discover pure isolated cycles
    const visited = new Set();
    // Traverse from all valid roots to find reachable nodes
    for (const root of roots) {
      const q = [root];
      while (q.length > 0) {
        const curr = q.shift();
        visited.add(curr);
        if (childrenOf[curr]) {
          for (const child of childrenOf[curr]) {
            q.push(child);
          }
        }
      }
    }

    // The unvisited nodes inherently form pure cycles mathematically (every node has exactly 1 parent in this sub-graph)
    const unvisitedNodesList = Array.from(allNodes).filter(n => !visited.has(n));
    const unvisitedNodes = new Set(unvisitedNodesList);
    const cycles = [];

    while (unvisitedNodes.size > 0) {
      const startNode = unvisitedNodes.values().next().value;
      let curr = startNode;
      const path = [];
      const pathSet = new Set();

      while (!pathSet.has(curr) && unvisitedNodes.has(curr)) {
        path.push(curr);
        pathSet.add(curr);
        unvisitedNodes.delete(curr);
        curr = parentOf[curr];
      }

      if (pathSet.has(curr)) {
        // We hit the cycle itself
        const cycleStartIndex = path.indexOf(curr);
        const cycleNodes = path.slice(cycleStartIndex);
        // Find lexicographically smallest node in the cycle
        cycleNodes.sort();
        cycles.push(cycleNodes[0]);
      }
    }

    // 6. Build the expected hierarchies and summaries
    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = null;
    let max_depth = 0;

    function buildTreeObj(node) {
      const obj = {};
      const children = childrenOf[node] || [];
      for (const child of children) {
        obj[child] = buildTreeObj(child);
      }
      return obj;
    }

    function getDepth(node) {
      const children = childrenOf[node] || [];
      if (children.length === 0) return 1;
      let maxChildDepth = 0;
      for (const child of children) {
        maxChildDepth = Math.max(maxChildDepth, getDepth(child));
      }
      return 1 + maxChildDepth;
    }

    // Process valid non-cyclic trees
    for (const root of roots) {
      const depth = getDepth(root);
      hierarchies.push({
        root: root,
        tree: { [root]: buildTreeObj(root) },
        depth: depth
      });
      total_trees++;
      
      if (depth > max_depth) {
        max_depth = depth;
        largest_tree_root = root;
      } else if (depth === max_depth) {
        if (!largest_tree_root || root < largest_tree_root) {
          largest_tree_root = root;
        }
      }
    }

    // Process pure cyclic groups
    for (const cycle of cycles) {
      hierarchies.push({
        root: cycle,
        tree: {},
        has_cycle: true
      });
      total_cycles++;
    }

    // Result compilation
    const responseObj = {
      user_id: "ANJUL_09062004",
      email_id: "as5067@srmist.edu.in",
      college_roll_number: "RA2311026010572",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root
      }
    };

    return new Response(JSON.stringify(responseObj), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request format" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}

// OPTIONS preflight request handler for CORS
export async function OPTIONS() {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}