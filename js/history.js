/**
 * history.js - State History Manager
 *
 * Virtual DOM 상태의 히스토리를 관리합니다.
 * 뒤로가기/앞으로가기 기능을 위한 Undo/Redo 스택 구현
 */

class StateHistory {
  constructor() {
    /** @type {Array} - VNode 배열의 히스토리 스택 */
    this.states = [];

    /** @type {number} - 현재 상태 인덱스 */
    this.currentIndex = -1;
  }

  /**
   * 새로운 상태를 히스토리에 추가합니다.
   * 현재 인덱스 이후의 상태는 모두 제거됩니다 (redo 히스토리 삭제).
   *
   * @param {Array} vnodes - 저장할 VNode 배열 (deep clone됨)
   */
  push(vnodes) {
    // 현재 위치 이후의 히스토리 제거 (새 분기)
    this.states = this.states.slice(0, this.currentIndex + 1);

    // Deep clone하여 저장 (참조 공유 방지)
    this.states.push(cloneVNode(vnodes));
    this.currentIndex = this.states.length - 1;
  }

  /**
   * 뒤로가기 (Undo)
   *
   * @returns {Array|null} 이전 상태의 VNode 배열 (없으면 null)
   */
  undo() {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return cloneVNode(this.states[this.currentIndex]);
  }

  /**
   * 앞으로가기 (Redo)
   *
   * @returns {Array|null} 다음 상태의 VNode 배열 (없으면 null)
   */
  redo() {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return cloneVNode(this.states[this.currentIndex]);
  }

  /**
   * 뒤로가기 가능 여부
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * 앞으로가기 가능 여부
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * 현재 상태를 반환합니다.
   * @returns {Array|null}
   */
  getCurrent() {
    if (this.currentIndex < 0) return null;
    return cloneVNode(this.states[this.currentIndex]);
  }

  /**
   * 현재 위치와 전체 히스토리 길이를 반환합니다.
   * @returns {{ current: number, total: number }}
   */
  getInfo() {
    return {
      current: this.currentIndex + 1,
      total: this.states.length
    };
  }

  /**
   * 히스토리를 초기화합니다.
   */
  clear() {
    this.states = [];
    this.currentIndex = -1;
  }
}
