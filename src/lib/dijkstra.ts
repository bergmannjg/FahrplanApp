'use strict';

/** 
 * see https://github.com/tcort/dijkstrajs 
 * 
 * add types
 * use fibonacci-heap
 */

/******************************************************************************
 * Created 2008-08-19.
 *
 * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
 *
 * Copyright (C) 2008
 *   Wyatt Baldwin <self@wyattbaldwin.com>
 *   All rights reserved
 *
 * Licensed under the MIT license.
 *
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *****************************************************************************/

import { FibonacciHeap } from '@tyriar/fibonacci-heap';

type Graph = { [index: string]: { [index: string]: number } }

export type { Graph }

export class Dijkstra {
  single_source_shortest_paths(graph: Graph, s: string, d: string) {
    // Predecessor map for each node that has been encountered.
    // node ID => predecessor node ID
    var predecessors: { [index: string]: string } = {};

    // Costs of shortest paths from s to all nodes encountered.
    // node ID => cost
    const costs: { [index: string]: number } = {};
    costs[s] = 0;

    // Costs of shortest paths from s to all nodes encountered; differs from
    // `costs` in that it provides easy access to the node that currently has
    // the known shortest path from s.
    // XXX: Do we actually need both `costs` and `open`?
    const open = new PriorityQueue();
    open.push(s, 0);

    let count = 0;
    while (!open.empty()) {
      // In the nodes remaining in graph that have a known cost from s,
      // find the node, u, that currently has the shortest path from s.
      const closest = open.pop();
      const u = closest.value;
      const cost_of_s_to_u = closest.cost;

      // Get nodes adjacent to u...
      const adjacent_nodes = graph[u] || {};

      // ...and explore the edges that connect u to those nodes, updating
      // the cost of the shortest paths to any or all of those nodes as
      // necessary. v is the node across the current edge from u.
      for (const v in adjacent_nodes) {
        count++;
        if (adjacent_nodes.hasOwnProperty(v)) {
          // Get the cost of the edge running from u to v.
          const cost_of_e = adjacent_nodes[v];

          // Cost of s to u plus the cost of u to v across e--this is *a*
          // cost from s to v that may or may not be less than the current
          // known cost to v.
          const cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;

          // If we haven't visited v yet OR if the current known cost from s to
          // v is greater than the new cost we just found (cost of s to u plus
          // cost of u to v across e), update v's cost in the cost list and
          // update v's predecessor in the predecessor list (it's now u).
          const cost_of_s_to_v = costs[v];
          const first_visit = (typeof costs[v] === 'undefined');
          if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
            costs[v] = cost_of_s_to_u_plus_cost_of_e;
            open.push(v, cost_of_s_to_u_plus_cost_of_e);
            predecessors[v] = u;
          }
        }
      }
    }

    console.log('loop count', count);

    if (typeof d !== 'undefined' && typeof costs[d] === 'undefined') {
      var msg = ['Could not find a path from ', s, ' to ', d, '.'].join('');
    }

    return predecessors;
  }

  extract_shortest_path_from_predecessor_list(predecessors: { [index: string]: string }, d: string) {
    var nodes: string[] = [];
    var u = d;
    while (u) {
      nodes.push(u);
      u = predecessors[u];
    }
    nodes.reverse();
    return nodes;
  }

  find_path(graph: Graph, s: string, d: string) {
    var predecessors = this.single_source_shortest_paths(graph, s, d);
    return this.extract_shortest_path_from_predecessor_list(
      predecessors, d);
  }
};

interface CostValue {
  cost: number;
  value: string;
}

/**
 * priority queue with FibonacciHeap.
 */
class PriorityQueue {
  heap = new FibonacciHeap<number, CostValue>();

  /**
   * Add a new item to the queue and ensure the highest priority element
   * is at the front of the queue.
   */
  push(value: string, cost: number) {
    var item = { value: value, cost: cost };
    this.heap.insert(cost, item);
  }

  /**
   * Return the highest priority element in the queue.
   */
  pop() {
    const node = this.heap.extractMinimum();
    if (node && node.value) return node.value
    else throw new Error('heap empty');
  }

  empty() {
    return this.heap.isEmpty();
  }
};

