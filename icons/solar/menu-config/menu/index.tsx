// Import Vue composition API
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import "./menu-drag-drop.css"; // Import the CSS file for drag and drop styles

type Item = {
  id: string;
  name: string;
  type: "parent" | "child" | "single";
  order: number; // Added order property for sorting
  children: Item[];
};

// CSS styles for drag and drop
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scalePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .item-enter-active {
    animation: fadeIn 0.5s ease-out;
  }
  
  .item-move {
    transition: transform 0.5s ease;
  }
  
  .pulse-animation {
    animation: scalePulse 2s infinite;
  }
  
  .shake-animation {
    animation: shake 0.5s ease-in-out;
  }
  
  .highlight-drop-target {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease-in-out;
  }
  
  .highlight-active {
    background-color: rgba(59, 130, 246, 0.1);
    border: 2px solid rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease-in-out;
  }
  
  .highlight-drop-target:hover {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
  }
  
  .dragging-item {
    opacity: 0.7;
    transform: rotate(-1deg) scale(0.98);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .drop-indicator {
    position: absolute;
    height: 2px;
    left: 0;
    right: 0;
    background: #3B82F6;
    z-index: 10;
    animation: pulse 1.5s infinite;
  }
  
  .single-type-badge {
    position: relative;
  }
  
  .single-type-badge::after {
    content: "Top level only";
    position: absolute;
    top: -18px;
    right: 0;
    font-size: 10px;
    background: #7e22ce;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .single-type-badge:hover::after {
    opacity: 1;
  }
  
  .forbidden-drop {
    position: relative;
    cursor: not-allowed !important;
  }
  
  .forbidden-drop::before {
    content: "⛔";
    position: absolute;
    right: 5px;
    top: 5px;
    font-size: 16px;
    z-index: 10;
  }
  
  @keyframes pulse {
    0% { opacity: 0.6; transform: scaleX(0.95); }
    50% { opacity: 1; transform: scaleX(1); }
    100% { opacity: 0.6; transform: scaleX(0.95); }
  }
  
  @keyframes bounce {
    0% { transform: translateX(0); }
    50% { transform: translateX(3px); }
    100% { transform: translateX(-3px); }
  }
  
  @keyframes highlight {
    0% { background-color: rgba(59, 130, 246, 0.1); }
    50% { background-color: rgba(59, 130, 246, 0.2); }
    100% { background-color: rgba(59, 130, 246, 0.1); }
  }
  
  .dragging {
    opacity: 0.5;
    transform: rotate(1deg);
  }
  
  .preparing-drag {
    box-shadow: 0 0 0 2px #3b82f6 !important;
    animation: highlight 0.5s ease;
  }
  
  /* Enhanced drop target styles */
  .potential-drop-target.is-drop-target {
    box-shadow: 0 0 0 2px #3b82f6, 0 0 15px rgba(59, 130, 246, 0.5);
    transform: translateY(-2px) scale(1.02);
    z-index: 10;
    background-color: #f0f7ff;
    transition: all 0.2s ease;
  }
  
  .parent-drop-target {
    background-color: #ebf5ff !important;
    box-shadow: 0 0 0 2px #3b82f6, 0 0 15px rgba(59, 130, 246, 0.5) !important;
    border-color: #3b82f6 !important;
    transform: scale(1.03) !important;
    z-index: 10;
  }
  
  /* Highlight the drag handle for more obvious draggable items */
  .drag-handle {
    transition: all 0.2s ease;
  }
  
  .drag-handle:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .hovered-top {
    box-shadow: 0 -4px 0 0 rgba(59, 130, 246, 0.7) !important;
    transform: translateY(2px);
    transition: all 0.2s ease-in-out;
  }
  
  .hovered-bottom {
    box-shadow: 0 4px 0 0 rgba(59, 130, 246, 0.7) !important;
    transform: translateY(-2px);
    transition: all 0.2s ease-in-out;
  }
  
  .hovered-between {
    position: relative;
  }
  
  .hovered-between::after {
    content: "";
    position: absolute;
    height: 5px;
    left: 0;
    right: 0;
    bottom: -3px;
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 10px;
    z-index: 20;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: pulse 1.5s infinite;
  }
  
  .drag-helper {
    position: fixed;
    pointer-events: none;
    z-index: 100;
    background: white;
    border-radius: 0.5rem;
    padding: 0.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: rotate(-2deg);
    opacity: 0.8;
    transition: all 0.2s ease;
  }
`;

// Use the styles in the component
(function injectStyles() {
  if (typeof document !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
})();

export default defineComponent({
  name: "DragDropPortals",
  setup() {
    const leftItems = ref<Item[]>([
      {
        id: "1",
        name: "Single Item 1",
        type: "single",
        order: 0,
        children: [],
      },
      {
        id: "2",
        name: "Child Item 2",
        type: "child",
        order: 1,
        children: [],
      },
      {
        id: "3",
        name: "Parent Item 3",
        type: "parent",
        order: 2,
        children: [],
      },
      {
        id: "5",
        name: "Single Item 5",
        type: "single",
        order: 3,
        children: [],
      },
    ]);

    const rightItems = ref<Item[]>([
      {
        id: "4",
        name: "Parent Item 3",
        type: "parent",
        order: 0,
        children: [
          { id: "4-1", name: "Child 3.1", type: "child", order: 0, children: [] },
          { id: "4-2", name: "Child 3.2", type: "child", order: 1, children: [] },
          { id: "4-3", name: "Child 3.3", type: "child", order: 2, children: [] },
        ],
      },
    ]);

    const draggedItem = ref<Item | null>(null);
    const draggedFrom = ref<"left" | "right" | null>(null);
    const draggedParentId = ref<string | null>(null);
    const expandedItems = ref(new Set(["1", "2", "4"]));
    const dropPosition = ref<{ itemId: string; position: "before" | "after" } | null>(null);
    const isDraggingOverParent = ref<string | null>(null); // ID of parent being dragged over, null if none
    const isDragging = ref(false); // Track if we're currently in a drag operation
    const statusMessage = ref<string>(""); // Show status messages for the current operation
    const lastAction = ref<string>(""); // Track the last completed action
    const animatedItems = ref<Set<string>>(new Set()); // Track which items have animations
    const animationType = ref<"pulse" | "shake">("pulse"); // Type of animation to show

    // Save/Load state functionality
    const savedMenus = ref<{ [key: string]: { left: Item[]; right: Item[] } }>({}); // For storing named menu layouts
    const currentLayoutName = ref<string>(""); // For the current layout name input

    // Helper function to create a deep copy of an item
    const deepCopyItem = (item: Item): Item => {
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        order: item.order,
        children: item.children.map(child => deepCopyItem(child)),
      };
    };

    // Handle keyboard shortcuts - without saveCurrentLayout
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if we're dragging
      if (!isDragging.value || !draggedItem.value)
        return;

      // Escape key cancels drag operation
      if (e.key === "Escape") {
        isDragging.value = false;
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;
        statusMessage.value = "Drag operation cancelled";

        // Remove highlights
        document.querySelectorAll(".highlight-drop-target").forEach((el) => {
          el.classList.remove("highlight-drop-target");
        });
      }
    };

    // Helper function to find an item by ID recursively through the entire tree
    const findItemById = (items: Item[], id: string): Item | null => {
      for (const item of items) {
        if (item.id === id)
          return item;

        if (item.children.length > 0) {
          const foundInChildren = findItemById(item.children, id);
          if (foundInChildren)
            return foundInChildren;
        }
      }
      return null;
    };

    // Helper to check if an item is a descendant of another
    const isDescendantOf = (childId: string, parentId: string, items: Item[]): boolean => {
      const parent = findItemById(items, parentId);
      if (!parent)
        return false;

      for (const child of parent.children) {
        if (child.id === childId)
          return true;
        if (isDescendantOf(childId, child.id, [child]))
          return true;
      }

      return false;
    };

    // Function to handle moving items up or down in the order
    const handleMoveItem = (
      item: Item,
      source: "left" | "right",
      parentId: string | null = null,
      direction: "up" | "down",
    ) => {
      const items = source === "left" ? [...leftItems.value] : [...rightItems.value];

      // Handle moving a child item
      if (parentId) {
        const parent = findItemById(items, parentId);
        if (!parent) {
          statusMessage.value = "Could not find parent item";
          return;
        }

        const childIndex = parent.children.findIndex(c => c.id === item.id);
        if (childIndex === -1) {
          statusMessage.value = "Could not find child item";
          return;
        }

        // Check boundaries
        if (direction === "up" && childIndex <= 0) {
          statusMessage.value = "Item is already at the top";
          return;
        }

        if (direction === "down" && childIndex >= parent.children.length - 1) {
          statusMessage.value = "Item is already at the bottom";
          return;
        }

        // Perform the swap
        const newChildren = [...parent.children];
        const swapIndex = direction === "up" ? childIndex - 1 : childIndex + 1;

        // Make sure both items exist
        if (!newChildren[childIndex] || !newChildren[swapIndex]) {
          statusMessage.value = "Error swapping items";
          return;
        }

        // Swap the order properties
        const currentOrder = newChildren[childIndex].order;
        newChildren[childIndex].order = newChildren[swapIndex].order;
        newChildren[swapIndex].order = currentOrder;

        // Sort by order
        parent.children = newChildren.sort((a, b) => a.order - b.order);

        // Update the state
        if (source === "left") {
          leftItems.value = [...items];
        } else {
          rightItems.value = [...items];
        }

        statusMessage.value = `Moved "${item.name}" ${direction}`;
        setTimeout(() => {
          if (statusMessage.value === `Moved "${item.name}" ${direction}`) {
            statusMessage.value = "";
          }
        }, 2000);

        return;
      }

      // Handle moving a top-level item
      const itemIndex = items.findIndex(i => i.id === item.id);
      if (itemIndex === -1) {
        statusMessage.value = "Could not find item";
        return;
      }

      // Check boundaries
      if (direction === "up" && itemIndex <= 0) {
        statusMessage.value = "Item is already at the top";
        return;
      }

      if (direction === "down" && itemIndex >= items.length - 1) {
        statusMessage.value = "Item is already at the bottom";
        return;
      }

      // Perform the swap
      const swapIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

      // Make sure both items exist
      if (!items[itemIndex] || !items[swapIndex]) {
        statusMessage.value = "Error swapping items";
        return;
      }

      // Swap the order properties
      const currentOrder = items[itemIndex].order;
      items[itemIndex].order = items[swapIndex].order;
      items[swapIndex].order = currentOrder;

      // Sort by order
      const sortedItems = items.sort((a, b) => a.order - b.order);

      // Update the state
      if (source === "left") {
        leftItems.value = sortedItems;
      } else {
        rightItems.value = sortedItems;
      }

      statusMessage.value = `Moved "${item.name}" ${direction}`;
      setTimeout(() => {
        if (statusMessage.value === `Moved "${item.name}" ${direction}`) {
          statusMessage.value = "";
        }
      }, 2000);
    };

    // Save/load functions for menu layouts
    const _saveCurrentLayout = () => {
      if (!currentLayoutName.value.trim()) {
        statusMessage.value = "Please enter a name for this layout";
        animationType.value = "shake";
        animatedItems.value.add("saveLayoutButton");
        setTimeout(() => {
          animatedItems.value.delete("saveLayoutButton");
        }, 1000);
        return;
      }

      savedMenus.value[currentLayoutName.value] = {
        left: leftItems.value.map(item => deepCopyItem(item)),
        right: rightItems.value.map(item => deepCopyItem(item)),
      };

      statusMessage.value = `Layout "${currentLayoutName.value}" saved successfully`;
      lastAction.value = statusMessage.value;

      // Save to localStorage for persistence
      localStorage.setItem("menuLayouts", JSON.stringify(savedMenus.value));

      // Clear the input
      currentLayoutName.value = "";

      // Add animation to show success
      animationType.value = "pulse";
      animatedItems.value.add("saveLayoutButton");
      setTimeout(() => {
        animatedItems.value.delete("saveLayoutButton");
      }, 1000);
    };

    // Load a saved layout by name
    const _loadLayout = (name: string) => {
      if (!savedMenus.value[name]) {
        statusMessage.value = `Layout "${name}" not found`;
        return;
      }

      // Replace current items with saved ones
      leftItems.value = savedMenus.value[name].left.map(item => deepCopyItem(item));
      rightItems.value = savedMenus.value[name].right.map(item => deepCopyItem(item));

      statusMessage.value = `Layout "${name}" loaded successfully`;
      lastAction.value = statusMessage.value;

      // Add animation to items to show they've been loaded
      animationType.value = "pulse";
      const allItemIds = new Set<string>();
      [...leftItems.value, ...rightItems.value].forEach((item) => {
        allItemIds.add(item.id);
        item.children.forEach(child => allItemIds.add(child.id));
      });
      animatedItems.value = allItemIds;
      setTimeout(() => {
        animatedItems.value = new Set();
      }, 1000);
    };

    // Delete a saved layout
    const _deleteLayout = (name: string) => {
      if (!savedMenus.value[name]) {
        statusMessage.value = `Layout "${name}" not found`;
        return;
      }

      delete savedMenus.value[name];
      localStorage.setItem("menuLayouts", JSON.stringify(savedMenus.value));
      statusMessage.value = `Layout "${name}" deleted`;
      lastAction.value = statusMessage.value;
    };

    onMounted(() => {
      const savedData = localStorage.getItem("menuLayouts");
      if (savedData) {
        try {
          savedMenus.value = JSON.parse(savedData);
          if (Object.keys(savedMenus.value).length > 0) {
            statusMessage.value = "Saved layouts loaded from storage";
            lastAction.value = statusMessage.value;
          }
        } catch (e) {
          console.error("Error loading saved layouts:", e);
          statusMessage.value = "Error loading saved layouts";
          lastAction.value = statusMessage.value;
        }
      }

      // Add keyboard shortcut handlers
      document.addEventListener("keydown", handleKeyDown);
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });

    const handleDragStart = (e: DragEvent, item: Item, source: "left" | "right", parentId: string | null = null) => {
      // Basic setup - no complex ghost elements
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";

        // Create a simple drag preview
        const dragPreview = document.createElement("div");
        dragPreview.className = "p-2 bg-white border border-blue-400 rounded shadow";
        dragPreview.innerHTML = `${item.name} (${item.type})`;
        document.body.appendChild(dragPreview);

        // Set a basic drag image
        e.dataTransfer.setDragImage(dragPreview, 15, 15);

        // Clean up
        setTimeout(() => {
          document.body.removeChild(dragPreview);
        }, 0);
      }

      // Create a deep copy to avoid reference issues
      draggedItem.value = deepCopyItem(item);
      draggedFrom.value = source;
      draggedParentId.value = parentId;
      isDragging.value = true;

      // Special status message for single type items
      if (item.type === "single") {
        statusMessage.value = `Dragging: ${item.name} (single - can only be placed at top level)`;
      } else {
        statusMessage.value = `Dragging: ${item.name} (${item.type})`;
      }

      // Highlight all potential drop targets with a simple class
      document.querySelectorAll(".potential-drop-target").forEach((el) => {
        el.classList.add("highlight-drop-target");
      });

      if (e.dataTransfer) {
        // Create a custom drag image for better visual feedback
        const dragPreview = document.createElement("div");
        dragPreview.className = "p-3 bg-white border-2 border-blue-400 rounded-lg shadow-lg z-50";
        dragPreview.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="inline-block w-4 h-4 rounded-full ${
              item.type === "parent"
                ? "bg-blue-500"
                : item.type === "child"
                  ? "bg-green-500"
                  : "bg-purple-500"
            }"></span>
            <span class="font-medium">${item.name}</span>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">${item.type}</span>
          </div>
        `;
        document.body.appendChild(dragPreview);

        // Set the drag image with offset for better positioning
        e.dataTransfer.setDragImage(dragPreview, 30, 20);

        // Remove the element after a short delay
        setTimeout(() => {
          document.body.removeChild(dragPreview);
        }, 100);

        // Set animation on the original element
        const dragElement = (e.target as HTMLElement).cloneNode(true) as HTMLElement;
        dragElement.style.transform = "rotate(-2deg) scale(0.95)";
        dragElement.style.opacity = "0.8";
        dragElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.12)";
        dragElement.style.transition = "all 0.2s ease";
        document.body.appendChild(dragElement);
        e.dataTransfer.setDragImage(dragElement, 0, 0);

        setTimeout(() => document.body.removeChild(dragElement), 0);
      }
    };

    const handleDragOver = (e: DragEvent, itemId?: string) => {
      e.preventDefault();

      // If no item is being dragged, or we're dragging over the same item, do nothing
      if (!draggedItem.value || (itemId && draggedItem.value.id === itemId)) {
        dropPosition.value = null;
        isDraggingOverParent.value = null;
        statusMessage.value = draggedItem.value ? `Dragging: ${draggedItem.value.name}` : "";

        // Remove any forbidden drop markers
        document.querySelectorAll(".forbidden-drop").forEach((el) => {
          el.classList.remove("forbidden-drop");
        });

        // Remove any drop indicators
        document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom").forEach((el) => {
          el.remove();
        });

        return;
      }

      // Get the rect of the target element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const threshold = height / 3; // Use thirds for top/middle/bottom

      // Determine drop position based on mouse position
      const topPart = y < threshold;
      const bottomPart = y > height - threshold;
      const middlePart = !topPart && !bottomPart;

      // Clear any existing drop indicators
      document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom").forEach((el) => {
        el.remove();
      });

      // Clear any between indicators
      document.querySelectorAll(".hovered-between").forEach((el) => {
        el.classList.remove("hovered-between");
      });

      // Create drop position indicator element
      const createDropIndicator = (position: "top" | "bottom") => {
        const indicator = document.createElement("div");
        indicator.className = `drop-indicator-${position}`;
        indicator.style.position = "absolute";
        indicator.style.left = "0";
        indicator.style[position] = "0";
        indicator.style.width = "100%";
        indicator.style.height = "3px";
        indicator.style.backgroundColor = "#3b82f6";
        indicator.style.zIndex = "10";
        return indicator;
      };

      // Get the target item
      const targetElement = e.currentTarget as HTMLElement;
      const targetId = itemId as string;
      const target = draggedFrom.value === "left" ? "left" : "right";
      const targetItems = target === "left" ? leftItems.value : rightItems.value;
      const targetItem = findItemById(targetItems, targetId);

      if (!targetItem)
        return;

      // Handle different drop positions based on where the cursor is
      if (topPart) {
        // Drop before target item
        dropPosition.value = {
          itemId: targetId,
          position: "before",
        };
        const indicator = createDropIndicator("top");
        targetElement.appendChild(indicator);

        // Message with context
        let betweenMessage = "";
        const targetIndex = targetItems.findIndex(i => i.id === targetId);

        // For between messages
        if (targetIndex > 0) {
          const prevItem = targetItems[targetIndex - 1];
          if (prevItem) {
            betweenMessage = ` (between "${prevItem.name}" and "${targetItem.name}")`;

            // Add visual between indicator
            const prevEl = document.querySelector(`[data-item-id="${prevItem.id}"]`);
            const targetEl = document.querySelector(`[data-item-id="${targetItem.id}"]`);

            if (prevEl && targetEl) {
              prevEl.classList.add("hovered-between");
              targetEl.classList.add("hovered-between");
            }
          }
        }

        statusMessage.value = `Place "${draggedItem.value.name}" before "${targetItem.name}"${betweenMessage}`;
      } else if (bottomPart) {
        // Drop after target item
        dropPosition.value = {
          itemId: targetId,
          position: "after",
        };
        const indicator = createDropIndicator("bottom");
        targetElement.appendChild(indicator);

        // Message with context
        let betweenMessage = "";
        const targetIndex = targetItems.findIndex(i => i.id === targetId);

        // For between messages (if not the last item)
        if (targetIndex < targetItems.length - 1) {
          const nextItem = targetItems[targetIndex + 1];
          if (nextItem) {
            betweenMessage = ` (between "${targetItem.name}" and "${nextItem.name}")`;

            // Add visual between indicator
            const targetEl = document.querySelector(`[data-item-id="${targetItem.id}"]`);
            const nextEl = document.querySelector(`[data-item-id="${nextItem.id}"]`);

            if (targetEl && nextEl) {
              targetEl.classList.add("hovered-between");
              nextEl.classList.add("hovered-between");
            }
          }
        }

        statusMessage.value = `Place "${draggedItem.value.name}" after "${targetItem.name}"${betweenMessage}`;
      } else if (middlePart && targetItem.type === "parent") {
        // Drop inside parent
        dropPosition.value = null;
        isDraggingOverParent.value = targetId;

        // Highlight the parent
        targetElement.classList.add("highlight-drop-target");

        // Check if trying to move parent to its own child
        if (
          draggedItem.value.type === "parent"
          && isDescendantOf(targetId, draggedItem.value.id, targetItems)
        ) {
          targetElement.classList.add("forbidden-drop");
          statusMessage.value = "Cannot move a parent into its own child!";
        } else {
          statusMessage.value = `Place "${draggedItem.value.name}" inside "${targetItem.name}"`;
        }
      } else {
        // No valid drop position
        dropPosition.value = null;
        isDraggingOverParent.value = null;
        statusMessage.value = draggedItem.value ? `Dragging: ${draggedItem.value.name}` : "";
      }
    };

    const handleDragLeave = () => {
      dropPosition.value = null;
      isDraggingOverParent.value = null;
      statusMessage.value = draggedItem.value ? `Dragging: ${draggedItem.value.name}` : "";

      // Clear between indicators
      const betweenElements = document.querySelectorAll(".hovered-between");
      betweenElements.forEach(el => el.classList.remove("hovered-between"));

      // Remove drop indicators
      document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom").forEach((el) => {
        el.remove();
      });
    };

    const handleDragEnd = () => {
      dropPosition.value = null;
      isDraggingOverParent.value = null;
      isDragging.value = false;

      // If no drop occurred
      if (draggedItem.value) {
        statusMessage.value = "Drag canceled";
        setTimeout(() => {
          statusMessage.value = "";
        }, 2000);
      }

      // Remove all visual indicators
      document.querySelectorAll(".highlight-drop-target").forEach((el) => {
        el.classList.remove("highlight-drop-target");
      });

      document.querySelectorAll(".hovered-between").forEach((el) => {
        el.classList.remove("hovered-between");
      });

      document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom").forEach((el) => {
        el.remove();
      });

      draggedItem.value = null;
      draggedFrom.value = null;
      draggedParentId.value = null;

      // Remove highlighting from potential drop targets
      document.querySelectorAll(".highlight-drop-target").forEach((el) => {
        el.classList.remove("highlight-drop-target");
      });

      // Remove active highlight
      document.querySelectorAll(".highlight-active").forEach((el) => {
        el.classList.remove("highlight-active");
      });

      // Remove any forbidden drop markers
      document.querySelectorAll(".forbidden-drop").forEach((el) => {
        el.classList.remove("forbidden-drop");
      });

      // Clear between indicators
      document.querySelectorAll(".hovered-between").forEach((el) => {
        el.classList.remove("hovered-between");
      });

      draggedItem.value = null;
      draggedFrom.value = null;
      draggedParentId.value = null;
    };

    const removeItemFromSource = (itemId: string, parentId: string | null = null): boolean => {
      // Return true if item was found and removed, false otherwise
      if (!draggedFrom.value)
        return false;

      const items = draggedFrom.value === "left" ? leftItems.value : rightItems.value;

      if (parentId) {
        // Item is a child of another item
        const parent = findItemById(items, parentId);
        if (!parent)
          return false;

        const childIndex = parent.children.findIndex(child => child.id === itemId);
        if (childIndex === -1)
          return false;

        // Remove the child from parent's children
        const updatedItems = items.map((item) => {
          if (item.id === parentId) {
            // Get the children with the target item removed
            const newChildren = item.children.filter(child => child.id !== itemId);

            // Update the order values of the remaining children
            for (let i = 0; i < newChildren.length; i++) {
              const child = newChildren[i];
              if (child) {
                child.order = i;
              }
            }

            return {
              ...item,
              children: newChildren,
            };
          }
          return item;
        });

        if (draggedFrom.value === "left") {
          leftItems.value = updatedItems;
        } else {
          rightItems.value = updatedItems;
        }

        return true;
      } else {
        // Item is a top-level item
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex === -1)
          return false;

        // Get the item being removed and save its children
        const itemToRemove = items[itemIndex];

        // Filter out the item to be removed
        const updatedItems = items.filter(item => item.id !== itemId);

        // Update order values for all remaining items
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          if (item) {
            item.order = i;
          }
        }

        // If the removed item is a parent with children, save those children
        // These will be added back when the item is dropped in the target
        if (itemToRemove && itemToRemove.type === "parent" && itemToRemove.children.length > 0) {
          // Ensure we preserve the children in the dragged item
          if (draggedItem.value) {
            draggedItem.value.children = [...itemToRemove.children];
          }
        }

        if (draggedFrom.value === "left") {
          leftItems.value = updatedItems;
        } else {
          rightItems.value = updatedItems;
        }

        return true;
      }
    };

    const addItemToParent = (target: "left" | "right", item: Item, parentId: string): boolean => {
      // Create a deep copy to avoid reference issues
      const itemToAdd = deepCopyItem(item);

      // On the left side, we don't allow nesting (only flat list)
      if (target === "left") {
        statusMessage.value = "Left side only allows a flat list of items";
        return false;
      }

      // Prevent adding "single" type items as children
      if (itemToAdd.type === "single") {
        statusMessage.value = "Cannot add single items as children";
        return false;
      }

      // At this point we know target is "right"
      const items = rightItems.value;

      const parent = findItemById(items, parentId);
      if (!parent)
        return false;

      const updatedItems = items.map((currentItem) => {
        if (currentItem.id === parentId) {
          // Set the order to the end of the children array
          item.order = currentItem.children.length;

          return {
            ...currentItem,
            children: [...currentItem.children, itemToAdd],
          };
        }

        // Also check in children recursively
        if (currentItem.children.length > 0) {
          let found = false;

          const updateChildren = (children: Item[]): Item[] => {
            return children.map((child) => {
              if (child.id === parentId) {
                found = true;

                // Set the order to the end of the children array
                item.order = child.children.length;

                return {
                  ...child,
                  children: [...child.children, itemToAdd],
                };
              }

              if (child.children.length > 0) {
                return {
                  ...child,
                  children: updateChildren(child.children),
                };
              }

              return child;
            });
          };

          const newChildren = updateChildren(currentItem.children);

          if (found) {
            return {
              ...currentItem,
              children: newChildren,
            };
          }
        }

        return currentItem;
      });

      // Here we need to handle both cases since it's coming from the recursive function
      // that works on both left and right items
      if ((target as string) === "left") {
        leftItems.value = updatedItems;
      } else {
        rightItems.value = updatedItems;
      }

      return true;
    };

    const addItemAtPosition = (
      target: "left" | "right",
      item: Item,
      targetItemId: string,
      position: "before" | "after",
      parentId: string | null = null,
    ): boolean => {
      // Create a deep copy to avoid reference issues
      const itemToAdd = deepCopyItem(item);

      // For consistency, always get the items based on target
      const items = target === "left" ? leftItems.value : rightItems.value;

      // Handle inserting at specific position within a parent's children
      if (parentId) {
        // On the left side, we don't allow nesting (only flat list)
        if (target === "left") {
          statusMessage.value = "Left side only allows a flat list of items";
          return false;
        }
        const parent = findItemById(items, parentId);
        if (!parent)
          return false;

        const childIndex = parent.children.findIndex(child => child.id === targetItemId);
        if (childIndex === -1)
          return false;

        // We'll let the map function handle the actual insertion

        const updatedItems = items.map((currentItem) => {
          if (currentItem.id === parentId) {
            // Get the index of the target child
            const childIndex = currentItem.children.findIndex(child => child.id === targetItemId);

            // Get position index - before or after the target item
            const posIndex = position === "before" ? childIndex : childIndex + 1;

            // Create a completely new array of children without the dragged item
            const newChildren = currentItem.children.filter(child => child.id !== itemToAdd.id);

            // Log debug information
            console.warn(`Child reordering: parentId=${parentId}, targetId=${targetItemId}, position=${position}, posIndex=${posIndex}`);
            console.warn(`Children before insertion:`, newChildren.map(c => `${c.name}(id:${c.id})`).join(", "));

            // Insert the item at the desired position
            newChildren.splice(posIndex, 0, itemToAdd);

            // Update order values for all children sequentially
            newChildren.forEach((child, index) => {
              child.order = index;
            });

            console.warn(`Children after insertion:`, newChildren.map(c => `${c.name}(id:${c.id},order:${c.order})`).join(", "));

            return {
              ...currentItem,
              children: newChildren,
            };
          }

          // Check nested children
          if (currentItem.children.length > 0) {
            let found = false;

            const updateChildren = (children: Item[]): Item[] => {
              return children.map((child) => {
                if (child.id === parentId) {
                  found = true;

                  // Get the index of the target child
                  const childIndex = child.children.findIndex(c => c.id === targetItemId);

                  // Get position index - before or after the target item
                  const posIndex = position === "before" ? childIndex : childIndex + 1;

                  // Create a completely new array of children without the dragged item
                  const newChildren = child.children.filter(c => c.id !== item.id);

                  // Log debug information
                  console.warn(`Nested child reordering: parentId=${parentId}, targetId=${targetItemId}, position=${position}, posIndex=${posIndex}`);
                  console.warn(`Nested children before insertion:`, newChildren.map(c => `${c.name}(id:${c.id})`).join(", "));

                  // Insert the item at the desired position
                  newChildren.splice(posIndex, 0, itemToAdd);

                  // Update order values for all children sequentially
                  newChildren.forEach((nestedChild, index) => {
                    nestedChild.order = index;
                  });

                  console.warn(`Nested children after insertion:`, newChildren.map(c => `${c.name}(id:${c.id},order:${c.order})`).join(", "));

                  return {
                    ...child,
                    children: newChildren,
                  };
                }

                if (child.children.length > 0) {
                  return {
                    ...child,
                    children: updateChildren(child.children),
                  };
                }

                return child;
              });
            };

            const newChildren = updateChildren(currentItem.children);

            if (found) {
              return {
                ...currentItem,
                children: newChildren,
              };
            }
          }

          return currentItem;
        });

        if ((target as string) === "left") {
          leftItems.value = updatedItems;
        } else {
          rightItems.value = updatedItems;
        }

        return true;
      }

      // Handle inserting at specific position in top-level items
      const itemIndex = items.findIndex(item => item.id === targetItemId);
      if (itemIndex === -1)
        return false;

      // Get position index - before or after the target item
      const posIndex = position === "before" ? itemIndex : itemIndex + 1;

      // Create a completely new array - a full copy of the original without the dragged item
      const newArray = items.filter(i => i.id !== itemToAdd.id);

      // Log debug information
      console.warn(`Reordering: targetId=${targetItemId}, position=${position}, posIndex=${posIndex}`);
      console.warn(`Items before insertion:`, newArray.map(i => `${i.name}(id:${i.id})`).join(", "));

      // Insert the item at the desired position with proper typing
      newArray.splice(posIndex, 0, {
        ...itemToAdd,
        // Set the parent to null for top-level items
        ...(itemToAdd.type !== "single" ? { parentId: null } : {}),
      });

      // Log detailed debug information
      console.warn(`Item inserted at position ${posIndex}:`, {
        id: itemToAdd.id,
        name: itemToAdd.name,
        order: itemToAdd.order,
      });

      // Update order values for all items sequentially
      newArray.forEach((item, index) => {
        item.order = index;
      });

      console.warn(`Items after insertion:`, newArray.map(i => `${i.name}(id:${i.id},order:${i.order})`).join(", "));

      // Update the state with the new array
      if (target === "left") {
        leftItems.value = [...newArray]; // Create a new reference to ensure reactivity
      } else {
        rightItems.value = [...newArray]; // Create a new reference to ensure reactivity
      }

      return true;
    };

    const addItemToEnd = (target: "left" | "right", item: Item): void => {
      // Create a deep copy to avoid reference issues
      const itemToAdd = deepCopyItem(item);

      if (target === "left") {
        // Set the order to the end of the array
        itemToAdd.order = leftItems.value.length;
        leftItems.value = [...leftItems.value, itemToAdd];
      } else {
        // Set the order to the end of the array
        itemToAdd.order = rightItems.value.length;
        rightItems.value = [...rightItems.value, itemToAdd];
      }
    };

    const handleDrop = (e: DragEvent, target: "left" | "right", targetParentId: string | null = null) => {
      e.preventDefault();

      // Ensure we have an item being dragged
      if (!draggedItem.value || !draggedFrom.value) {
        dropPosition.value = null;
        isDraggingOverParent.value = null;
        return;
      }

      // Prevent dropping on the left side if the drag started from the left side
      // (Left side should only allow drags TO the right side, not reorganizing within left)
      if (target === "left" && draggedFrom.value === "left") {
        statusMessage.value = "Cannot reorganize left side. Left side is for dragging to right only.";
        lastAction.value = statusMessage.value;

        // Reset drag state
        isDragging.value = false;
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;

        // Clear status message after a delay
        setTimeout(() => {
          if (statusMessage.value === lastAction.value) {
            statusMessage.value = "";
          }
        }, 3000);

        return;
      }

      // Store current state before we reset visual indicators
      const currentDropPosition = dropPosition.value;
      const currentParentTarget = isDraggingOverParent.value;

      // Clear visual indicators
      dropPosition.value = null;
      isDraggingOverParent.value = null;

      // Get a clean deep copy of the item being dragged
      const itemToMove = deepCopyItem(draggedItem.value);

      // CASE 1: Dropping INTO a parent (indicated by currentParentTarget)
      if (currentParentTarget) {
        // On the left side, we don't allow nesting (only flat list)
        if (target === "left") {
          statusMessage.value = "Left side only allows a flat list of items";
          lastAction.value = statusMessage.value;

          // Reset drag state
          isDragging.value = false;
          draggedItem.value = null;
          draggedFrom.value = null;
          draggedParentId.value = null;

          // Clear status message after a delay
          setTimeout(() => {
            if (statusMessage.value === lastAction.value) {
              statusMessage.value = "";
            }
          }, 3000);

          return;
        }

        // Prevent "single" type items from being added as children
        if (itemToMove.type === "single") {
          statusMessage.value = `Cannot add single items as children. Use at top level only.`;
          lastAction.value = statusMessage.value;

          // Reset drag state
          isDragging.value = false;
          draggedItem.value = null;
          draggedFrom.value = null;
          draggedParentId.value = null;

          // Clear status message after a delay
          setTimeout(() => {
            if (statusMessage.value === lastAction.value) {
              statusMessage.value = "";
            }
          }, 3000);

          return;
        }

        // First, remove the item from its source
        const removed = removeItemFromSource(itemToMove.id, draggedParentId.value);
        if (!removed) {
          console.warn("Failed to remove item from source");
          return;
        }

        // Then add it to the target parent
        const added = addItemToParent(target, itemToMove, currentParentTarget);
        if (!added) {
          console.warn("Failed to add item to parent:", currentParentTarget);
          statusMessage.value = "Failed to add item to parent";
        } else {
          const parent = findItemById((target as string) === "left" ? leftItems.value : rightItems.value, currentParentTarget);
          statusMessage.value = `Added "${itemToMove.name}" as child of "${parent?.name || "parent"}"`;
          lastAction.value = statusMessage.value;
        }

        // Reset drag state
        isDragging.value = false;
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;

        // Clear status message after a delay
        setTimeout(() => {
          if (statusMessage.value === lastAction.value) {
            statusMessage.value = "";
          }
        }, 3000);

        return;
      }

      // CASE 2: Dropping ON a specific position (before or after an item)
      if (currentDropPosition) {
        // Handle drops between containers or within the same container
        // Display debug information using allowed warn method
        console.warn("Debug - Position:", currentDropPosition.position, "Item ID:", currentDropPosition.itemId);

        // Get information about the target item and its context
        const allItems = [...leftItems.value, ...rightItems.value];
        const _targetItem = findItemById(allItems, currentDropPosition.itemId);

        // Prevent single items from being placed as children
        if (itemToMove.type === "single" && targetParentId !== null) {
          statusMessage.value = `Cannot add single items as children. Use at top level only.`;
          lastAction.value = statusMessage.value;

          // Reset drag state
          isDragging.value = false;
          draggedItem.value = null;
          draggedFrom.value = null;
          draggedParentId.value = null;

          // Clear status message after a delay
          setTimeout(() => {
            if (statusMessage.value === lastAction.value) {
              statusMessage.value = "";
            }
          }, 3000);

          return;
        }

        // Prevent dropping a parent onto itself or its descendants
        if (itemToMove.type === "parent") {
          // Prevent dropping onto itself
          if (itemToMove.id === currentDropPosition.itemId) {
            return;
          }

          // Prevent dropping onto its descendants
          const sourceItems = draggedFrom.value === "left" ? leftItems.value : rightItems.value;
          if (isDescendantOf(currentDropPosition.itemId, itemToMove.id, sourceItems)) {
            return;
          }
        }

        // Remove item from source - this ensures the item is properly removed
        // from its current position before being added to the new position
        const removed = removeItemFromSource(itemToMove.id, draggedParentId.value);
        if (!removed) {
          console.warn("Failed to remove item from source");
          return;
        }

        // Add at specific position - the filter in addItemAtPosition will prevent duplicates
        const added = addItemAtPosition(
          target,
          itemToMove,
          currentDropPosition.itemId,
          currentDropPosition.position,
          targetParentId,
        );

        if (!added) {
          // Fallback: add to the end
          addItemToEnd(target, itemToMove);
          statusMessage.value = `Added "${itemToMove.name}" to the end`;
        } else {
          const positionItem = findItemById(
            target === "left" ? leftItems.value : rightItems.value,
            currentDropPosition.itemId,
          );

          // Log the current order of items for debugging
          const currentItems = target === "left" ? leftItems.value : rightItems.value;
          console.warn("Current items order after drop:", currentItems.map(item => `${item.name}(${item.order})`).join(", "));

          statusMessage.value = `Placed "${itemToMove.name}" ${currentDropPosition.position} "${positionItem?.name || "item"}"`;
        }

        lastAction.value = statusMessage.value;

        // Reset drag state
        isDragging.value = false;
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;

        // Clear status message after a delay
        setTimeout(() => {
          if (statusMessage.value === lastAction.value) {
            statusMessage.value = "";
          }
        }, 3000);

        return;
      }

      // CASE 3: Dropping directly onto a parent item (not in center or at position)
      if (targetParentId) {
        // Prevent "single" type items from being added to parents
        if (itemToMove.type === "single") {
          statusMessage.value = `Cannot add single items as children. Use at top level only.`;
          lastAction.value = statusMessage.value;

          // Create a shake animation effect
          const elements = document.querySelectorAll(".single-type-badge");
          elements.forEach((el) => {
            el.classList.add("shake-animation");
            setTimeout(() => el.classList.remove("shake-animation"), 500);
          });

          // Reset drag state
          isDragging.value = false;
          draggedItem.value = null;
          draggedFrom.value = null;
          draggedParentId.value = null;

          // Clear status message after a delay
          setTimeout(() => {
            if (statusMessage.value === lastAction.value) {
              statusMessage.value = "";
            }
          }, 3000);

          return;
        }

        // Remove item from source
        const removed = removeItemFromSource(itemToMove.id, draggedParentId.value);
        if (!removed) {
          console.warn("Failed to remove item from source");
          return;
        }

        // Add to parent
        const added = addItemToParent(target, itemToMove, targetParentId);
        if (!added) {
          console.warn("Failed to add item to parent:", targetParentId);
        }

        // Reset drag state
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;
        return;
      }

      // CASE 4: Dropping into an empty container or somewhere with no specific target
      // Remove item from source
      const removed = removeItemFromSource(itemToMove.id, draggedParentId.value);
      if (!removed) {
        console.warn("Failed to remove item from source");
        return;
      }

      // Add to the end of the target container
      addItemToEnd(target, itemToMove);

      // Reset drag state
      draggedItem.value = null;
      draggedFrom.value = null;
      draggedParentId.value = null;
    };

    const toggleExpanded = (itemId: string) => {
      const newExpanded = new Set(expandedItems.value);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      expandedItems.value = newExpanded;
    };

    const renderItem = (item: Item, source: "left" | "right", parentId: string | null = null, level = 0) => {
      const isExpanded = expandedItems.value.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isDropTarget = dropPosition.value?.itemId === item.id;
      const dropIndicatorPosition = dropPosition.value?.position;
      const isParentTarget = isDraggingOverParent.value === item.id;

      // Simplified render for left side (flat list)
      if (source === "left") {
        return (
          <div key={item.id} class="select-none relative item-enter-active">
            {isDropTarget && dropIndicatorPosition === "before" && (
              <div class="absolute left-0 right-0 h-2 bg-blue-500 -top-1.5 z-10 rounded-full animate-pulse shadow-md transition-all duration-300 transform scale-x-100 flex items-center justify-center">
                <div class="absolute h-4 w-4 bg-blue-600 rounded-full left-0 -ml-1 shadow-sm"></div>
                <div class="absolute h-4 w-4 bg-blue-600 rounded-full right-0 -mr-1 shadow-sm"></div>
              </div>
            )}

            <div
              draggable
              onDragstart={e => handleDragStart(e as DragEvent, item, source, parentId)}
              onDragover={e => handleDragOver(e as DragEvent, item.id)}
              onDragleave={handleDragLeave}
              onDragend={handleDragEnd}
              onDrop={e => handleDrop(e as DragEvent, source, item.type === "parent" ? item.id : parentId)}
              class={[
                "flex items-center p-3 mb-2 bg-white rounded-lg border-2 border-gray-200 cursor-grab hover:shadow-md transition-all duration-300 hover:border-blue-300 transform hover:translate-y-[-2px] potential-drop-target",
                item.type === "parent" ? "border-l-4 border-l-blue-500" : "",
                item.type === "child" ? "border-l-4 border-l-green-500" : "",
                item.type === "single" ? "border-l-4 border-l-purple-500" : "",
                isDropTarget ? "ring-2 ring-blue-400 shadow-lg" : "",
                isDragging.value ? "highlight-active" : "",
              ]}
              data-id={item.id}
            >
              {/* Drag handle */}
              <div class="mr-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zM13 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                </svg>
              </div>

              <div class="flex-1">
                <div class="font-medium text-gray-900">{item.name}</div>
                <div class="flex items-center gap-2">
                  <div
                    class={[
                      "text-xs px-2 py-1 rounded-full inline-block mt-1",
                      item.type === "parent"
                        ? "bg-blue-100 text-blue-800"
                        : item.type === "child"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800 single-type-badge",
                    ]}
                  >
                    {item.type === "single" ? "single" : item.type}
                  </div>
                </div>
              </div>

              {/* Quick reordering buttons - only for right side */}
              {source !== "left" && (
                <div class="flex items-center mr-2">
                  <button
                    onClick={() => handleMoveItem(item, source, parentId, "up")}
                    class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Move up"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveItem(item, source, parentId, "down")}
                    class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Move down"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {isDropTarget && dropIndicatorPosition === "after" && (
              <div class="absolute left-0 right-0 h-2 bg-blue-500 -bottom-1.5 z-10 rounded-full animate-pulse shadow-md transition-all duration-300 transform scale-x-100 flex items-center justify-center">
                <div class="absolute h-4 w-4 bg-blue-600 rounded-full left-0 -ml-1 shadow-sm"></div>
                <div class="absolute h-4 w-4 bg-blue-600 rounded-full right-0 -mr-1 shadow-sm"></div>
              </div>
            )}
          </div>
        );
      }

      // Regular hierarchical render for right side
      return (
        <div key={item.id} class="select-none relative item-enter-active">
          {isDropTarget && dropIndicatorPosition === "before" && (
            <div class="absolute left-0 right-0 h-2 bg-blue-500 -top-1.5 z-10 rounded-full animate-pulse shadow-md transition-all duration-300 transform scale-x-100 flex items-center justify-center">
              <div class="absolute h-4 w-4 bg-blue-600 rounded-full left-0 -ml-1 shadow-sm"></div>
              <div class="absolute h-4 w-4 bg-blue-600 rounded-full right-0 -mr-1 shadow-sm"></div>
            </div>
          )}

          <div
            draggable
            onDragstart={e => handleDragStart(e as DragEvent, item, source, parentId)}
            onDragover={e => handleDragOver(e as DragEvent, item.id)}
            onDragleave={handleDragLeave}
            onDragend={handleDragEnd}
            onDrop={e => handleDrop(e as DragEvent, source, item.type === "parent" ? item.id : parentId)}
            class={[
              "flex items-center p-3 mb-2 bg-white rounded-lg border-2 border-gray-200 cursor-move hover:shadow-md transition-all duration-300 hover:border-blue-300 transform hover:translate-y-[-2px] potential-drop-target",
              level > 0 ? "ml-6 bg-gray-50" : "",
              item.type === "parent" ? "border-l-4 border-l-blue-500" : "",
              item.type === "child" ? "border-l-4 border-l-green-500" : "",
              item.type === "single" ? "border-l-4 border-l-purple-500" : "",
              isDropTarget ? "is-drop-target" : "",
              isParentTarget ? "parent-drop-target" : "",
              isDragging.value ? "highlight-active" : "",
            ]}
            style={{ marginLeft: `${level * 20}px` }}
            data-id={item.id}
          >
            {/* Drag handle - Enhanced for better grabbing */}
            <div
              class="mr-2 flex-shrink-0 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors cursor-grab active:cursor-grabbing active:bg-gray-300 border border-gray-200 drag-handle"
              title="Drag to reorder"
              onMousedown={() => {
                // Add a class to the item when the drag handle is clicked
                const itemElement = document.querySelector(`[data-id="${item.id}"]`);
                if (itemElement) {
                  itemElement.classList.add("preparing-drag");
                  setTimeout(() => {
                    itemElement.classList.remove("preparing-drag");
                  }, 200);
                }
              }}
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zM13 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
              </svg>
            </div>

            {hasChildren && (
              <button onClick={() => toggleExpanded(item.id)} class="mr-2 p-1 rounded hover:bg-gray-200 transition-colors">
                <svg
                  class={["w-4 h-4 transform transition-transform duration-300 ease-in-out", isExpanded ? "rotate-90" : ""]}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  />
                </svg>
              </button>
            )}

            <div class="flex-1">
              <div class="font-medium text-gray-900">{item.name}</div>
              <div class="flex items-center gap-2">
                <div
                  class={[
                    "text-xs px-2 py-1 rounded-full inline-block mt-1",
                    item.type === "parent"
                      ? "bg-blue-100 text-blue-800"
                      : item.type === "child"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800 single-type-badge",
                  ]}
                >
                  {item.type === "single" ? "single (top-level only)" : item.type}
                </div>
                <div class="text-xs px-2 py-1 rounded-full mt-1 bg-gray-100 text-gray-600 flex items-center">
                  <span>
                    Order:
                    {item.order}
                  </span>
                  <div class="flex ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveItem(item, source, parentId, "up");
                      }}
                      class="bg-gray-200 hover:bg-gray-300 rounded p-1 ml-1"
                      title="Move Up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveItem(item, source, parentId, "down");
                      }}
                      class="bg-gray-200 hover:bg-gray-300 rounded p-1 ml-1"
                      title="Move Down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {" "}
            {isParentTarget && (
              <div class="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none animate-pulse transition-all duration-300">
                <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium shadow-sm transform scale-105 transition-transform duration-300">
                  Drop to add as child
                </div>
              </div>
            )}
          </div>

          {isDropTarget && dropIndicatorPosition === "after" && (
            <div class="absolute left-0 right-0 h-2 bg-blue-500 -bottom-1.5 z-10 rounded-full animate-pulse shadow-md transition-all duration-300 transform scale-x-100 flex items-center justify-center">
              <div class="absolute h-4 w-4 bg-blue-600 rounded-full left-0 -ml-1 shadow-sm"></div>
              <div class="absolute h-4 w-4 bg-blue-600 rounded-full right-0 -mr-1 shadow-sm"></div>
            </div>
          )}

          {hasChildren && isExpanded && (
            <div class="ml-4 transition-all duration-300 ease-in-out overflow-hidden">
              {/* Sort children by order before rendering */}
              {[...item.children]
                .sort((a, b) => a.order - b.order)
                .map(child => renderItem(child, source, item.id, level + 1))}
            </div>
          )}
        </div>
      );
    };

    const renderPortal = (items: Item[], target: "left" | "right") => {
      // For left side, flatten the structure to show all items in a single list
      let displayItems = items;

      if (target === "left") {
        // Create a flat list of all items (including children) for the left side
        const flattenItems = (items: Item[]): Item[] => {
          let result: Item[] = [];

          for (const item of items) {
            // Add this item
            result.push({ ...item, children: [] }); // Create a copy with empty children array

            // Add all children items flattened
            if (item.children && item.children.length > 0) {
              result = result.concat(flattenItems(item.children));
            }
          }

          return result;
        };

        // Use flattened items for left display
        displayItems = flattenItems(items).sort((a, b) => a.order - b.order);
      }

      return (
        <div class="flex-1 bg-gray-100 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg" data-portal={target}>
          <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <div class={["w-3 h-3 rounded-full mr-2", target === "left" ? "bg-blue-500" : "bg-orange-500"]} />
            {target === "left" ? "Modules List" : "Menu List"}
          </h2>

          <div
            onDragover={e => handleDragOver(e as DragEvent)}
            onDragleave={handleDragLeave}
            onDrop={e => handleDrop(e as DragEvent, target)}
            class="min-h-96 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
            data-portal={target}
          >
            {displayItems.length === 0
              ? (
                  <div class="flex items-center justify-center h-32 text-gray-500">
                    <div class="text-center">
                      <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        />
                      </svg>
                      <p>Drop items here</p>
                    </div>
                  </div>
                )
              : (
                  target === "left"
                    ? displayItems.map(item => renderItem(item, target))
                    : [...items]
                        .sort((a, b) => a.order - b.order)
                        .map(item => renderItem(item, target))
                )}
          </div>
        </div>
      );
    };

    return () => (
      <div class="flex flex-col gap-4">
        <div class="flex gap-6">
          {renderPortal(leftItems.value, "left")}
          {renderPortal(rightItems.value, "right")}
        </div>
      </div>
    );
  },
});
