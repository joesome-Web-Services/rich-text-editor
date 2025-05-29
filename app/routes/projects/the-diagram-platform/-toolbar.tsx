import {
  Rectangle,
  Group,
  Mode,
  getSelectedRectangles,
  getRectangleGroup,
} from "./-rectangle";

interface ToolbarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedBorderColor: string;
  setSelectedBorderColor: (color: string) => void;
  rectangles: Rectangle[];
  groups: Group[];
  updateSelectedColors: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  deleteSelected: () => void;
}

export function Toolbar({
  mode,
  setMode,
  selectedColor,
  setSelectedColor,
  selectedBorderColor,
  setSelectedBorderColor,
  rectangles,
  groups,
  updateSelectedColors,
  groupSelected,
  ungroupSelected,
  deleteSelected,
}: ToolbarProps) {
  return (
    <div className="bg-white shadow-sm border-b p-4 flex items-center gap-4 flex-wrap">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("select")}
          className={`px-4 py-2 rounded ${mode === "select" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Select (V)
        </button>
        <button
          onClick={() => setMode("rectangle")}
          className={`px-4 py-2 rounded ${mode === "rectangle" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Rectangle (R)
        </button>
        <button
          onClick={() => setMode("arrow")}
          className={`px-4 py-2 rounded ${mode === "arrow" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Arrow (A)
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Fill:</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => {
            setSelectedColor(e.target.value);
            updateSelectedColors();
          }}
          className="w-8 h-8 rounded border"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Border:</label>
        <input
          type="color"
          value={selectedBorderColor}
          onChange={(e) => {
            setSelectedBorderColor(e.target.value);
            updateSelectedColors();
          }}
          className="w-8 h-8 rounded border"
        />
      </div>

      <button
        onClick={() => {
          const selectedRects = getSelectedRectangles(rectangles);
          if (selectedRects.length > 0) {
            const hasGroup = selectedRects.some((rect) =>
              getRectangleGroup(rect.id, groups)
            );
            if (hasGroup) {
              ungroupSelected();
            } else {
              groupSelected();
            }
          }
        }}
        className="px-4 py-2 bg-purple-500 text-white rounded"
      >
        {getSelectedRectangles(rectangles).some((rect) =>
          getRectangleGroup(rect.id, groups)
        )
          ? "Ungroup (G)"
          : "Group (G)"}
      </button>

      <button
        onClick={deleteSelected}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Delete
      </button>
    </div>
  );
}
