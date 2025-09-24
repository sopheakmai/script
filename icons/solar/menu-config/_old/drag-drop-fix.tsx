type Item = {
  id: string;
  name: string;
  type: "parent" | "child" | "single";
  children: Item[];
};

export default defineComponent({
  name: "DragDropPortals",
  setup() {
    const leftItems = ref<Item[]>([
      {
        id: "1",
        name: "Parent Item 1",
        type: "parent",
        children: [
          { id: "1-1", name: "Child 1.1", type: "child", children: [] },
          { id: "1-2", name: "Child 1.2", type: "child", children: [] },
        ],
      },
      {
        id: "2",
        name: "Parent Item 2",
        type: "parent",
        children: [
          { id: "2-1", name: "Child 2.1", type: "child", children: [] },
        ],
      },
      {
        id: "3",
        name: "Single Item",
        type: "single",
        children: [],
      },
    ]);

    const rightItems = ref<Item[]>([
      {
        id: "4",
        name: "Parent Item 3",
        type: "parent",
        children: [
          { id: "4-1", name: "Child 3.1", type: "child", children: [] },
          { id: "4-2", name: "Child 3.2", type: "child", children: [] },
          { id: "4-3", name: "Child 3.3", type: "child", children: [] },
        ],
      },
    ]);

    const draggedItem = ref<Item | null>(null);
    const draggedFrom = ref<"left" | "right" | null>(null);
    const draggedParentId = ref<string | null>(null);
    const expandedItems = ref(new Set(["1", "2", "4"]));
    const dropPosition = ref<{ itemId: string; position: "before" | "after" } | null>(null);
    const isDraggingOverParent = ref<string | null>(null); // ID of parent being dragged over, null if none

    // Helper function to create a deep copy of an item
    const deepCopyItem = (item: Item): Item => {
      return {
        id: item.id,
        name: item.name,
        type: item.type,
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

      if (e.dataTransfer) {
        const dragElement = (e.target as HTMLElement).cloneNode(true) as HTMLElement;
        dragElement.style.transform = "rotate(-2deg)";
        dragElement.style.opacity = "0.8";
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
        return;
      }

      // If we're not hovering over a specific item, reset visual indicators
      if (!itemId) {
        dropPosition.value = null;
        isDraggingOverParent.value = null;
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
        const centerZoneStart = rect.top + rect.height * 0.3;
        const centerZoneEnd = rect.top + rect.height * 0.7;

        if (mouseY > centerZoneStart && mouseY < centerZoneEnd) {
          // We're hovering in the center zone of a parent - show indicator to add as child
          dropPosition.value = null;
          isDraggingOverParent.value = targetItem.id;
          return;
        }
      }

      // Not hovering in center of parent, reset parent indicator
      isDraggingOverParent.value = null;

      // Determine if we're hovering on top half or bottom half for ordering
      const threshold = rect.top + rect.height / 2;
      dropPosition.value = {
        itemId,
        position: mouseY < threshold ? "before" : "after",
      };
    };

    const handleDragLeave = () => {
      dropPosition.value = null;
      isDraggingOverParent.value = null;
    };

    const handleDragEnd = () => {
      dropPosition.value = null;
      isDraggingOverParent.value = null;
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
            return {
              ...item,
              children: item.children.filter(child => child.id !== itemId),
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

        const updatedItems = items.filter(item => item.id !== itemId);

        if (draggedFrom.value === "left") {
          leftItems.value = updatedItems;
        } else {
          rightItems.value = updatedItems;
        }

        return true;
      }
    };

    const addItemToParent = (target: "left" | "right", item: Item, parentId: string): boolean => {
      const items = target === "left" ? leftItems.value : rightItems.value;

      const parent = findItemById(items, parentId);
      if (!parent)
        return false;

      const updatedItems = items.map((currentItem) => {
        if (currentItem.id === parentId) {
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

        const insertIndex = position === "before" ? childIndex : childIndex + 1;

        const updatedItems = items.map((currentItem) => {
          if (currentItem.id === parentId) {
            const newChildren = [...currentItem.children];
            newChildren.splice(insertIndex, 0, item);

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
                  const newChildren = [...child.children];
                  newChildren.splice(insertIndex, 0, item);

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

      const insertIndex = position === "before" ? itemIndex : itemIndex + 1;
      const updatedItems = [...items];
      updatedItems.splice(insertIndex, 0, item);

      if (target === "left") {
        leftItems.value = updatedItems;
      } else {
        rightItems.value = updatedItems;
      }

      return true;
    };

    const addItemToEnd = (target: "left" | "right", item: Item): void => {
      if (target === "left") {
        leftItems.value = [...leftItems.value, item];
      } else {
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
        }

        // Reset drag state
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;
        return;
      }

      // CASE 2: Dropping ON a specific position (before or after an item)
      if (currentDropPosition) {
        // Handle drops between containers or within the same container

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

        // Remove item from source
        const removed = removeItemFromSource(itemToMove.id, draggedParentId.value);
        if (!removed) {
          console.warn("Failed to remove item from source");
          return;
        }

        // Add at specific position
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
        }

        // Reset drag state
        draggedItem.value = null;
        draggedFrom.value = null;
        draggedParentId.value = null;
        return;
      }

      // CASE 3: Dropping directly onto a parent item (not in center or at position)
      if (targetParentId) {
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
        <div key={item.id} class="select-none relative">
          {isDropTarget && dropIndicatorPosition === "before" && (
            <div class="absolute left-0 right-0 h-1 bg-blue-500 -top-1.5 z-10 rounded-full"></div>
          )}

          <div
            draggable
            onDragstart={e => handleDragStart(e as DragEvent, item, source, parentId)}
            onDragover={e => handleDragOver(e as DragEvent, item.id)}
            onDragleave={handleDragLeave}
            onDragend={handleDragEnd}
            onDrop={e => handleDrop(e as DragEvent, source, item.type === "parent" ? item.id : null)}
            class={[
              "flex items-center p-3 mb-2 bg-white rounded-lg border-2 border-gray-200 cursor-move hover:shadow-md transition-all duration-200 hover:border-blue-300",
              level > 0 ? "ml-6 bg-gray-50" : "",
              item.type === "parent" ? "border-l-4 border-l-blue-500" : "",
              item.type === "child" ? "border-l-4 border-l-green-500" : "",
              item.type === "single" ? "border-l-4 border-l-purple-500" : "",
              isDropTarget ? "ring-2 ring-blue-400" : "",
              isParentTarget ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400" : "",
            ]}
            style={{ marginLeft: `${level * 20}px` }}
          >
            {hasChildren && (
              <button onClick={() => toggleExpanded(item.id)} class="mr-2 p-1 rounded hover:bg-gray-200 transition-colors">
                <svg
                  class={["w-4 h-4 transform transition-transform", isExpanded ? "rotate-90" : ""]}
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
              <div
                class={[
                  "text-xs px-2 py-1 rounded-full inline-block mt-1",
                  item.type === "parent"
                    ? "bg-blue-100 text-blue-800"
                    : item.type === "child"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800",
                ]}
              >
                {item.type}
              </div>
            </div>

            {isParentTarget && (
              <div class="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
                <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  Drop to add as child
                </div>
              </div>
            )}
          </div>

          {isDropTarget && dropIndicatorPosition === "after" && (
            <div class="absolute left-0 right-0 h-1 bg-blue-500 -bottom-1.5 z-10 rounded-full"></div>
          )}

          {hasChildren && isExpanded && (
            <div class="ml-4">
              {item.children.map(child => renderItem(child, source, item.id, level + 1))}
            </div>
          )}
        </div>
      );
    };

    const renderPortal = (items: Item[], target: "left" | "right", title: string) => (
      <div class="flex-1 bg-gray-100 p-6 rounded-xl">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <div class={["w-3 h-3 rounded-full mr-2", target === "left" ? "bg-blue-500" : "bg-orange-500"]} />
          {title}
        </h2>

        <div
          onDragover={e => handleDragOver(e as DragEvent)}
          onDragleave={handleDragLeave}
          onDrop={e => handleDrop(e as DragEvent, target)}
          class="min-h-96 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
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
                items.map(item => renderItem(item, target))
              )}
        </div>
      </div>
    );

    return () => (
      <div class="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Vue-Style Drag & Drop Portals</h1>
          <p class="text-gray-600">Drag parent and child items between portals. Parents can contain children!</p>
        </div>

        <div class="flex gap-6">
          {renderPortal(leftItems.value, "left", "Portal A")}
          {renderPortal(rightItems.value, "right", "Portal B")}
        </div>

        <div class="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 class="font-semibold mb-2">Features:</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Drag parent items with their children</li>
            <li>• Drag individual child items between parents</li>
            <li>• Expand/collapse parent items</li>
            <li>• Visual feedback during drag operations</li>
            <li>• Prevents invalid drops (e.g., parent into its own child)</li>
          </ul>
        </div>
      </div>
    );
  },
});
