import React from 'react';
import { BaseEdge, getSmoothStepPath, useReactFlow } from '@xyflow/react';

export default function OrthogonalEdge(props) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, selected, data } = props;
  const { setEdges } = useReactFlow();
  
  // Get offset from edge data
  const offsetX = data?.offsetX || 0;
  
  // Calculate center X with offset
  const centerX = sourceX + (targetX - sourceX) / 2 + offsetX;

  // Generate the orthogonal path
  const [edgePath] = getSmoothStepPath({
    sourceX, 
    sourceY, 
    sourcePosition, 
    targetX, 
    targetY, 
    targetPosition,
    borderRadius: 0, // Strict 90 degree corners
    centerX, // Apply user offset
  });

  const onDragStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initialOffset = offsetX;
    
    const onMouseMove = (moveEvent) => {
      // Very basic drag logic: we adjust offsetX
      // Note: This works best when zoom is 1. If zoomed, we might need screenToFlowPosition.
      const deltaX = (moveEvent.clientX - startX); 
      
      setEdges((eds) => eds.map(edge => {
        if (edge.id === id) {
           return { ...edge, data: { ...edge.data, offsetX: initialOffset + deltaX } };
        }
        return edge;
      }));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // The middle vertical segment goes from roughly sourceY to targetY at X = centerX
  const verticalSegmentLength = Math.abs(targetY - sourceY);
  const midY = sourceY + (targetY - sourceY) / 2;
  const isVerticalSignificant = verticalSegmentLength > 20;

  return (
    <>
      {/* Invisible thick line for easy clicking */}
      <BaseEdge path={edgePath} style={{ stroke: 'transparent', strokeWidth: 20 }} />
      
      {/* The actual visible wire */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* Segment Drag Handle (Only visible when selected) */}
      {selected && isVerticalSignificant && (
        <line
          x1={centerX}
          y1={Math.min(sourceY, targetY) + 10}
          x2={centerX}
          y2={Math.max(sourceY, targetY) - 10}
          stroke="transparent"
          strokeWidth={15}
          style={{ cursor: 'col-resize', pointerEvents: 'all' }}
          onMouseDown={onDragStart}
        />
      )}
      
      {/* Visual indicator for drag handle */}
      {selected && isVerticalSignificant && (
        <line
          x1={centerX}
          y1={Math.min(sourceY, targetY) + 10}
          x2={centerX}
          y2={Math.max(sourceY, targetY) - 10}
          stroke="#00d2ff"
          strokeWidth={3}
          strokeDasharray="4 4"
          style={{ pointerEvents: 'none', opacity: 0.8 }}
        />
      )}
    </>
  );
}
