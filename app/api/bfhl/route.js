import { NextResponse } from "next/server";

// ── helpers ──────────────────────────────────────────────────────────────────

function isValid(entry) {
    const trimmed = entry.trim();
    const re = /^[A-Z]->[A-Z]$/;
    return re.test(trimmed);
}

function buildGraph(edges) {
    // adjacency list + parent tracker
    const children = {};   // node -> [child, ...]
    const parentOf = {};   // child -> first parent
    const allNodes = new Set();

    for (const edge of edges) {
        const [p, c] = edge.split("->");
        allNodes.add(p);
        allNodes.add(c);
        if (!children[p]) children[p] = [];
        // first-parent-wins
        if (parentOf[c] === undefined) {
            parentOf[c] = p;
            children[p].push(c);
        }
        // if already has a parent, silently discard
    }
    return { children, parentOf, allNodes };
}

function detectCycle(node, children, visited, recStack) {
    visited.add(node);
    recStack.add(node);
    for (const child of (children[node] || [])) {
        if (!visited.has(child)) {
            if (detectCycle(child, children, visited, recStack)) return true;
        } else if (recStack.has(child)) {
            return true;
        }
    }
    recStack.delete(node);
    return false;
}

function buildTree(node, children) {
    const obj = {};
    for (const child of (children[node] || [])) {
        obj[child] = buildTree(child, children);
    }
    return { [node]: obj };
}

function getDepth(node, children) {
    if (!children[node] || children[node].length === 0) return 1;
    return 1 + Math.max(...children[node].map(c => getDepth(c, children)));
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
    const body = await request.json();
    const data = body.data || [];

    const invalid_entries = [];
    const duplicate_edges = [];
    const seenEdges = new Set();
    const validEdges = [];

    // 1. validate + deduplicate
    for (const entry of data) {
        const trimmed = entry.trim();
        if (!isValid(trimmed)) {
            invalid_entries.push(trimmed === entry ? entry : entry); // push original
            continue;
        }
        if (seenEdges.has(trimmed)) {
            if (!duplicate_edges.includes(trimmed)) {
                duplicate_edges.push(trimmed);
            }
        } else {
            seenEdges.add(trimmed);
            validEdges.push(trimmed);
        }
    }

    // 2. build graph
    const { children, parentOf, allNodes } = buildGraph(validEdges);

    // 3. find connected groups using union-find style grouping
    // group nodes into trees by finding roots
    const roots = [...allNodes].filter(n => parentOf[n] === undefined);

    // find all nodes reachable from each root
    function getGroup(root) {
        const group = new Set();
        const stack = [root];
        while (stack.length) {
            const n = stack.pop();
            if (group.has(n)) continue;
            group.add(n);
            for (const c of (children[n] || [])) stack.push(c);
        }
        return group;
    }

    const visited_nodes = new Set();
    const hierarchies = [];

    // process rooted groups
    for (const root of roots.sort()) {
        const group = getGroup(root);
        group.forEach(n => visited_nodes.add(n));

        // cycle detection within group
        const vis = new Set();
        const rec = new Set();
        let hasCycle = false;
        for (const n of group) {
            if (!vis.has(n)) {
                if (detectCycle(n, children, vis, rec)) { hasCycle = true; break; }
            }
        }

        if (hasCycle) {
            hierarchies.push({ root, tree: {}, has_cycle: true });
        } else {
            const tree = buildTree(root, children);
            const depth = getDepth(root, children);
            hierarchies.push({ root, tree, depth });
        }
    }

    // handle pure cycles (nodes never seen as roots)
    const unvisited = [...allNodes].filter(n => !visited_nodes.has(n));
    if (unvisited.length > 0) {
        // group them
        const cycleVisited = new Set();
        for (const node of unvisited.sort()) {
            if (cycleVisited.has(node)) continue;
            const group = getGroup(node);
            group.forEach(n => cycleVisited.add(n));
            const cycleRoot = [...group].sort()[0];
            hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
        }
    }

    // 4. summary
    const trees = hierarchies.filter(h => !h.has_cycle);
    const total_trees = trees.length;
    const total_cycles = hierarchies.filter(h => h.has_cycle).length;

    let largest_tree_root = "";
    let maxDepth = -1;
    for (const t of trees) {
        if (t.depth > maxDepth || (t.depth === maxDepth && t.root < largest_tree_root)) {
            maxDepth = t.depth;
            largest_tree_root = t.root;
        }
    }

    const response = {
        user_id: "ANJUL_09062004",
        email_id: "as5067@srmist.edu.in",
        college_roll_number: "RA2311026010572",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: { total_trees, total_cycles, largest_tree_root },
    };

    return NextResponse.json(response, {
        headers: { "Access-Control-Allow-Origin": "*" },
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}