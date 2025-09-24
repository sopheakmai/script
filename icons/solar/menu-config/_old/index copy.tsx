type Item = {
  id: string;
  name: string;
  type: "parent" | "child" | "single";
  order: number; // Added order property for sorting
  children: Item[];
};

// Style for animations
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
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
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
        children: [
          { id: "4", name: "Child Item 4", type: "child", order: 0, children: [] },
        ],
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

    const handleDragStart = (e: DragEvent, item: Item, source: "left" | "right", parentId: string | null = null) => {
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

      // Highlight all potential drop targets
      document.querySelectorAll(".potential-drop-target").forEach((el) => {
        el.classList.add("highlight-drop-target");
      });

      if (e.dataTransfer) {
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

        return;
      }

      // If we're not hovering over a specific item, reset visual indicators
      if (!itemId) {
        dropPosition.value = null;
        isDraggingOverParent.value = null;
        statusMessage.value = `Dragging: ${draggedItem.value.name} - Drop here to add to the end`;
        return;
      }

      // Get the element being hovered over
      const element = e.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      const mouseY = e.clientY;

      // Get all items from both containers for searching
      const allItems = [...leftItems.value, ...rightItems.value];

      // Find the item being hovered over
      const targetItem = findItemById(allItems, itemId);
      if (!targetItem)
        return;

      // Add highlight class to current element for better visibility
      document.querySelectorAll(".highlight-active").forEach((el) => {
        el.classList.remove("highlight-active");
      });
      element.classList.add("highlight-active");

      // For "single" type items, prevent dropping on or between parent/child items
      if (draggedItem.value.type === "single" && (targetItem.type === "parent" || targetItem.type === "child")) {
        // If the parent/child item is inside a container with other single items,
        // allow dropping before/after but not as a child
        const container = element.closest("[data-portal]");
        if (container) {
          const containerItems = container.getAttribute("data-portal") === "left" ? leftItems.value : rightItems.value;
          // Check if the container has any top-level items
          const hasSingleItems = containerItems.some(item => item.type === "single");

          if (!hasSingleItems) {
            // If no single items in this container, don't allow dropping here at all
            dropPosition.value = null;
            isDraggingOverParent.value = null;
            statusMessage.value = `Single items can only be placed at top level`;

            // Add forbidden class to the target element
            if (element) {
              element.classList.add("forbidden-drop");
              setTimeout(() => element.classList.remove("forbidden-drop"), 1500);
            }

            return;
          }

          // Otherwise, allow dropping but show warning
          statusMessage.value = `Warning: Single items can only be placed at top level`;
        }
      } else {
        // Remove any forbidden drop markers for other item types
        document.querySelectorAll(".forbidden-drop").forEach((el) => {
          el.classList.remove("forbidden-drop");
        });
      }

      // Prevent dropping a parent into one of its own descendants
      if (draggedItem.value.type === "parent") {
        const sourceItems = draggedFrom.value === "left" ? leftItems.value : rightItems.value;
        if (isDescendantOf(itemId, draggedItem.value.id, sourceItems)) {
          dropPosition.value = null;
          isDraggingOverParent.value = null;
          return;
        }
      }

      // For parent items, determine if we're hovering in the center area to add as child
      if (targetItem.type === "parent") {
        // Prevent "single" type items from being added as children
        if (draggedItem.value.type === "single") {
          // Do not show parent drop indicator for single type items
          isDraggingOverParent.value = null;
        } else {
          const centerZoneStart = rect.top + rect.height * 0.3;
          const centerZoneEnd = rect.top + rect.height * 0.7;

          if (mouseY > centerZoneStart && mouseY < centerZoneEnd) {
            // We're hovering in the center zone of a parent - show indicator to add as child
            dropPosition.value = null;
            isDraggingOverParent.value = targetItem.id;
            statusMessage.value = `Add "${draggedItem.value.name}" as child of "${targetItem.name}"`;
            return;
          }
        }
      }

      // Not hovering in center of parent, reset parent indicator
      isDraggingOverParent.value = null;

      // Determine if we're hovering on top half or bottom half for ordering
      const threshold = rect.top + rect.height / 2;
      const position = mouseY < threshold ? "before" : "after";

      // Check for special case: item from index 3 moving to index 0
      const sourceItems = draggedFrom.value === "left" ? leftItems.value : rightItems.value;
      const sourceIndex = sourceItems.findIndex((i: Item) => i.id === draggedItem.value?.id);

      // Determine the correct target container
      const target = element.closest("[data-portal]")?.getAttribute("data-portal") as "left" | "right" || "left";
      const targetItems = target === "left" ? leftItems.value : rightItems.value;
      const targetIndex = targetItems.findIndex((i: Item) => i.id === itemId);
      const isSameContainer = draggedFrom.value === target;

      // If trying to drop a "single" type item on a child item, show a warning
      if (draggedItem.value.type === "single" && targetItem.type === "child") {
        statusMessage.value = `Cannot place single items under or as child items`;
        dropPosition.value = {
          itemId,
          position,
        };
        // Still allow the drop at this position, but provide a warning
        return;
      }

      dropPosition.value = {
        itemId,
        position,
      };

      // Add a visual indicator for "between" items when applicable
      const betweenElements = document.querySelectorAll(".hovered-between");
      betweenElements.forEach(el => el.classList.remove("hovered-between"));

      // For placing after an item (except the last one)
      if (position === "after" && targetIndex < targetItems.length - 1) {
        const nextItem = targetItems[targetIndex + 1];
        if (nextItem) {
          // Find and add the hovered-between class to highlight this position
          const currentElement = document.querySelector(`[data-id="${itemId}"]`);
          if (currentElement) {
            currentElement.classList.add("hovered-between");
          }
        }
      }
      // For placing before an item (except the first one)
      else if (position === "before" && targetIndex > 0) {
        const prevItem = targetItems[targetIndex - 1];
        if (prevItem) {
          // Find and add the hovered-between class to highlight this position
          const prevElement = document.querySelector(`[data-id="${prevItem.id}"]`);
          if (prevElement) {
            prevElement.classList.add("hovered-between");
          }
        }
      }

      // Special message for moving item 3 to position 0
      if (isSameContainer && position === "before" && targetIndex === 0 && sourceIndex === 3) {
        statusMessage.value = `Special reorder: Move item from position 3 to 0, pushing item 0 to position 1`;
      } else {
        // Enhanced status message to show "between" context when appropriate
        let betweenMessage = "";

        // For placing after an item (except the last one)
        if (position === "after" && targetIndex < targetItems.length - 1) {
          const nextItem = targetItems[targetIndex + 1];
          if (nextItem) {
            betweenMessage = ` (between "${targetItem.name}" and "${nextItem.name}")`;
          }
        }
        // For placing before an item (except the first one)
        else if (position === "before" && targetIndex > 0) {
          const prevItem = targetItems[targetIndex - 1];
          if (prevItem) {
            betweenMessage = ` (between "${prevItem.name}" and "${targetItem.name}")`;
          }
        }

        statusMessage.value = `Place "${draggedItem.value.name}" ${position} "${targetItem.name}"${betweenMessage}`;
      }
    };

    const handleDragLeave = () => {
      dropPosition.value = null;
      isDraggingOverParent.value = null;
      statusMessage.value = draggedItem.value ? `Dragging: ${draggedItem.value.name}` : "";

      // Clear between indicators
      const betweenElements = document.querySelectorAll(".hovered-between");
      betweenElements.forEach(el => el.classList.remove("hovered-between"));
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

        // Filter out the item to be removed
        const updatedItems = items.filter(item => item.id !== itemId);

        // Update order values for all remaining items
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          if (item) {
            item.order = i;
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
      // Prevent adding "single" type items as children
      if (item.type === "single") {
        return false;
      }

      const items = target === "left" ? leftItems.value : rightItems.value;

      const parent = findItemById(items, parentId);
      if (!parent)
        return false;

      const updatedItems = items.map((currentItem) => {
        if (currentItem.id === parentId) {
          // Set the order to the end of the children array
          item.order = currentItem.children.length;

          return {
            ...currentItem,
            children: [...currentItem.children, item],
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
                  children: [...child.children, item],
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

      if (target === "left") {
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
      const items = target === "left" ? leftItems.value : rightItems.value;

      // Handle inserting at specific position within a parent's children
      if (parentId) {
        const parent = findItemById(items, parentId);
        if (!parent)
          return false;

        const childIndex = parent.children.findIndex(child => child.id === targetItemId);
        if (childIndex === -1)
          return false;

        const posIndex = position === "before" ? childIndex : childIndex + 1;

        const updatedItems = items.map((currentItem) => {
          if (currentItem.id === parentId) {
            // Get the index of the target child
            const childIndex = currentItem.children.findIndex(child => child.id === targetItemId);

            // Get position index - before or after the target item
            const posIndex = position === "before" ? childIndex : childIndex + 1;

            // Create a completely new array of children without the dragged item
            const newChildren = currentItem.children.filter(child => child.id !== item.id);

            // Log debug information
            console.warn(`Child reordering: parentId=${parentId}, targetId=${targetItemId}, position=${position}, posIndex=${posIndex}`);
            console.warn(`Children before insertion:`, newChildren.map(c => `${c.name}(id:${c.id})`).join(", "));

            // Insert the item at the desired position
            newChildren.splice(posIndex, 0, item);

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
                  newChildren.splice(posIndex, 0, item);

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

        if (target === "left") {
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
      const newArray = items.filter(i => i.id !== item.id);

      // Log debug information
      console.warn(`Reordering: targetId=${targetItemId}, position=${position}, posIndex=${posIndex}`);
      console.warn(`Items before insertion:`, newArray.map(i => `${i.name}(id:${i.id})`).join(", "));

      // Insert the item at the desired position
      newArray.splice(posIndex, 0, item);

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
      if (target === "left") {
        // Set the order to the end of the array
        item.order = leftItems.value.length;
        leftItems.value = [...leftItems.value, item];
      } else {
        // Set the order to the end of the array
        item.order = rightItems.value.length;
        rightItems.value = [...rightItems.value, item];
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
          const parent = findItemById(target === "left" ? leftItems.value : rightItems.value, currentParentTarget);
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
              isDropTarget ? "ring-2 ring-blue-400 shadow-lg" : "",
              isParentTarget ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400 shadow-lg scale-[1.02]" : "",
              isDragging.value ? "highlight-active" : "",
            ]}
            style={{ marginLeft: `${level * 20}px` }}
            data-id={item.id}
          >
            {/* Drag handle */}
            <div class="mr-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
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
                <div class="text-xs px-2 py-1 rounded-full inline-block mt-1 bg-gray-100 text-gray-600">
                  Order:
                  {" "}
                  {item.order}
                </div>
              </div>
            </div>

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

    const renderPortal = (items: Item[], target: "left" | "right", title: string) => (
      <div class="flex-1 bg-gray-100 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg" data-portal={target}>
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <div class={["w-3 h-3 rounded-full mr-2", target === "left" ? "bg-blue-500" : "bg-orange-500"]} />
          {title}
        </h2>

        <div
          onDragover={e => handleDragOver(e as DragEvent)}
          onDragleave={handleDragLeave}
          onDrop={e => handleDrop(e as DragEvent, target)}
          class="min-h-96 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
          data-portal={target}
        >
          {items.length === 0
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
                [...items]
                  .sort((a, b) => a.order - b.order)
                  .map(item => renderItem(item, target))
              )}
        </div>
        <div class="mt-3 transition-all duration-300 ease-in-out transform hover:scale-105">
          <div class="bg-blue-50 p-3 rounded-lg text-xs text-blue-600 border border-blue-100 shadow-sm">
            <div class="font-semibold mb-1">Tip:</div>
            <p>Drop items in the center of a parent to add as a child, or between items to change the order.</p>
          </div>
        </div>
      </div>
    );

    return () => (
      <div class="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <style>{styles}</style>
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Vue-Style Drag & Drop Portals</h1>
          <p class="text-gray-600">Drag parent and child items between portals. Parents can contain children!</p>
        </div>

        {/* Status message bar */}
        {statusMessage.value && (
          <div class="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg shadow-sm border border-blue-200 transition-all duration-300 animate-fadeIn">
            <div class="flex items-center">
              <div class="mr-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="font-medium">{statusMessage.value}</div>
            </div>
          </div>
        )}

        <div class="flex gap-6 mb-4">
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1">
            <h3 class="font-bold text-gray-800 mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              How to Use Drag & Drop
            </h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 p-1 rounded-full mr-2">
                  <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <span class="font-medium">Reorder items</span>
                  : Drag up/down between items
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-green-100 p-1 rounded-full mr-2">
                  <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <span class="font-medium">Add to parent</span>
                  : Drag to center of parent item
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-purple-100 p-1 rounded-full mr-2">
                  <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <span class="font-medium">Move between portals</span>
                  : Drag to other container
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-yellow-100 p-1 rounded-full mr-2">
                  <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <span class="font-medium">Watch status bar</span>
                  : Shows current drag operation
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-6">
          {renderPortal(leftItems.value, "left", "Portal A")}
          {renderPortal(rightItems.value, "right", "Portal B")}
        </div>

        <div class="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow transition-all duration-300 transform hover:shadow-md hover:border-blue-200">
          <h3 class="font-semibold mb-2">Features:</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li class="transition-all duration-300 transform hover:translate-x-1 hover:text-blue-600">• Drag parent items with their children</li>
            <li class="transition-all duration-300 transform hover:translate-x-1 hover:text-blue-600">• Drag individual child items between parents</li>
            <li class="transition-all duration-300 transform hover:translate-x-1 hover:text-blue-600">• Expand/collapse parent items</li>
            <li class="transition-all duration-300 transform hover:translate-x-1 hover:text-blue-600">• Visual feedback during drag operations</li>
            <li class="transition-all duration-300 transform hover:translate-x-1 hover:text-blue-600">• Prevents invalid drops (e.g., parent into its own child)</li>
          </ul>
        </div>
      </div>
    );
  },
});
