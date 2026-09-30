import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const defaultNodes = [
  {
    id: '1',
    data: { label: 'Analyzing Document...' },
    position: { x: 300, y: 150 },
    style: {
      background: '#2563eb',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '12px 20px',
      fontWeight: 'bold',
      border: 'none',
    },
  },
];

export default function MindMap({ documentId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`http://localhost:5000/api/ai/mindmap/${documentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate mind map');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.nodes && data.edges) {
          // Format node styles for the dark theme
          const styledNodes = data.nodes.map((node, idx) => ({
            ...node,
            style: {
              background: idx === 0 ? '#2563eb' : '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: idx === 0 ? '600' : '400',
              fontSize: '13px',
              textAlign: 'center',
            },
          }));

          const styledEdges = data.edges.map((edge) => ({
            ...edge,
            animated: true,
            style: { stroke: '#475569', strokeWidth: 1.5 },
          }));

          setNodes(styledNodes);
          setEdges(styledEdges);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic graph:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentId, setNodes, setEdges]);

  return (
    <div className="relative h-full w-full bg-slate-950">
      {loading && (
        <div className="absolute top-4 right-4 z-10 rounded-md bg-slate-800/90 px-3 py-1.5 text-xs text-blue-400 border border-slate-700 backdrop-blur">
          Generating concept topology...
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
      </ReactFlow>
    </div>
  );
}