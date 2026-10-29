/**
 * Browser page translators (Chrome/Edge "Translate this page", and to a
 * lesser degree Safari and Firefox) swap the text nodes React rendered for
 * their own <font> wrappers. When React later removes one of those text
 * nodes, or inserts next to it, the DOM call throws NotFoundError and the
 * whole route falls into the error boundary.
 *
 * Components avoid the common cases by giving changing text its own element
 * (see AGENTS.md). This guard is the safety net for the rest: a node that is
 * no longer where React left it is treated as already removed, and an
 * insertion whose reference node moved is appended instead of throwing.
 * Workaround from facebook/react#11538.
 */
export function installTranslatorGuard(): void {
  if (typeof Node !== "function" || !Node.prototype) return;

  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function guardedRemoveChild<T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };

  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function guardedInsertBefore<T extends Node>(
    this: Node,
    node: T,
    reference: Node | null,
  ): T {
    if (reference && reference.parentNode !== this) {
      return insertBefore.call(this, node, null) as T;
    }
    return insertBefore.call(this, node, reference) as T;
  };
}
