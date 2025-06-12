
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Maximize2, Move, RotateCcw } from 'lucide-react';

interface DiagramControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  spacing: number;
  onSpacingChange: (spacing: number) => void;
  viewMode: 'compact' | 'normal' | 'detailed';
  onViewModeChange: (mode: 'compact' | 'normal' | 'detailed') => void;
  onFitView: () => void;
  onReset: () => void;
}

export const DiagramControls: React.FC<DiagramControlsProps> = ({
  zoom,
  onZoomChange,
  spacing,
  onSpacingChange,
  viewMode,
  onViewModeChange,
  onFitView,
  onReset
}) => {
  return (
    <Card className="absolute top-4 right-4 z-10 p-4 w-64 bg-white/95 backdrop-blur-sm shadow-lg">
      <div className="space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Zoom: {Math.round(zoom * 100)}%</label>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => onZoomChange(value)}
              min={0.1}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Spacing Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Spacing: {spacing}%</label>
          <Slider
            value={[spacing]}
            onValueChange={([value]) => onSpacingChange(value)}
            min={50}
            max={150}
            step={10}
            className="w-full"
          />
        </div>

        {/* View Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">View Mode</label>
          <div className="grid grid-cols-3 gap-1">
            {(['compact', 'normal', 'detailed'] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? 'default' : 'outline'}
                onClick={() => onViewModeChange(mode)}
                className="text-xs"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={onFitView} className="flex-1">
            <Maximize2 className="h-4 w-4 mr-1" />
            Fit
          </Button>
          <Button size="sm" variant="outline" onClick={onReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};
