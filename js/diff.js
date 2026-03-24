/**
 * diff.js - Diff Algorithm
 *
 * 두 Virtual DOM 트리를 비교하여 최소 변경 사항(patches)을 찾아내는 알고리즘
 *
 * 5가지 핵심 Diff 케이스:
 * 1. CREATE  - 새로운 노드가 추가됨
 * 2. REMOVE  - 기존 노드가 제거됨
 * 3. REPLACE - 노드 타입이 변경됨 (예: div → span, 요소 → 텍스트)
 * 4. UPDATE  - 같은 타입이지만 속성(props)이 변경됨
 * 5. CHILDREN - 자식 노드들의 변경 (재귀적으로 위 4가지 적용)
 */

// ============================================================
// Patch 타입 상수
// ============================================================
const PATCH_TYPES = {
  CREATE: 'CREATE',
  REMOVE: 'REMOVE',
  REPLACE: 'REPLACE',
  UPDATE: 'UPDATE',
  // CHILDREN은 UPDATE 내부에 childPatches로 포함됨
};

// ============================================================
// 1. 메인 Diff 함수
// ============================================================

/**
 * 두 VNode를 비교하여 patch 객체를 반환합니다.
 *
 * @param {Object|null} oldVNode - 이전 VNode (없으면 null)
 * @param {Object|null} newVNode - 새로운 VNode (없으면 null)
 * @returns {Object|null} patch 객체 또는 null (변경 없음)
 */
function diff(oldVNode, newVNode) {
  // Case 1: CREATE - 이전 노드가 없고 새 노드가 있음
  if (oldVNode === null || oldVNode === undefined) {
    if (newVNode === null || newVNode === undefined) {
      return null;
    }
    return { type: PATCH_TYPES.CREATE, newVNode: newVNode };
  }

  // Case 2: REMOVE - 이전 노드가 있고 새 노드가 없음
  if (newVNode === null || newVNode === undefined) {
    return { type: PATCH_TYPES.REMOVE };
  }

  // Case 3: REPLACE - 노드 타입이 다름
  if (hasNodeChanged(oldVNode, newVNode)) {
    return { type: PATCH_TYPES.REPLACE, newVNode: newVNode };
  }

  // 텍스트 노드는 타입 비교에서 이미 처리됨
  if (oldVNode.type === 'TEXT_NODE') {
    return null; // 값이 같으면 여기까지 옴
  }

  // Case 4 & 5: UPDATE - 같은 타입, props와 children 비교
  const propPatches = diffProps(oldVNode.props, newVNode.props);
  const childPatches = diffChildren(oldVNode.children, newVNode.children);

  // 변경 사항이 없으면 null 반환
  if (propPatches.length === 0 && childPatches.length === 0) {
    return null;
  }

  return {
    type: PATCH_TYPES.UPDATE,
    propPatches: propPatches,
    childPatches: childPatches
  };
}

// ============================================================
// 2. 노드 변경 여부 판별
// ============================================================

/**
 * 두 VNode의 타입이 변경되었는지 확인합니다.
 *
 * @param {Object} oldVNode
 * @param {Object} newVNode
 * @returns {boolean}
 */
function hasNodeChanged(oldVNode, newVNode) {
  // 타입이 다름 (예: div → span, 요소 → 텍스트)
  if (oldVNode.type !== newVNode.type) {
    return true;
  }

  // 둘 다 텍스트 노드인데 값이 다름
  if (oldVNode.type === 'TEXT_NODE' && newVNode.type === 'TEXT_NODE') {
    return oldVNode.value !== newVNode.value;
  }

  return false;
}

// ============================================================
// 3. Props Diff
// ============================================================

/**
 * 두 props 객체를 비교하여 변경된 속성 목록을 반환합니다.
 *
 * @param {Object} oldProps
 * @param {Object} newProps
 * @returns {Array} 속성 변경 패치 배열
 *   - { action: 'SET', key, value } : 추가 또는 수정
 *   - { action: 'REMOVE', key }     : 삭제
 */
function diffProps(oldProps, newProps) {
  const patches = [];

  // 새로 추가되거나 변경된 속성
  for (const key of Object.keys(newProps)) {
    if (oldProps[key] !== newProps[key]) {
      patches.push({ action: 'SET', key: key, value: newProps[key] });
    }
  }

  // 삭제된 속성
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps)) {
      patches.push({ action: 'REMOVE', key: key });
    }
  }

  return patches;
}

// ============================================================
// 4. Children Diff
// ============================================================

/**
 * 자식 노드 배열을 비교하여 각 인덱스별 patch를 반환합니다.
 *
 * @param {Array} oldChildren
 * @param {Array} newChildren
 * @returns {Array} 인덱스별 { index, patch } 배열
 */
function diffChildren(oldChildren, newChildren) {
  const patches = [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChild = i < oldChildren.length ? oldChildren[i] : null;
    const newChild = i < newChildren.length ? newChildren[i] : null;

    const childPatch = diff(oldChild, newChild);
    if (childPatch !== null) {
      patches.push({ index: i, patch: childPatch });
    }
  }

  return patches;
}

// ============================================================
// 5. VNode 배열(컨테이너) 수준 Diff
// ============================================================

/**
 * 두 VNode 배열(컨테이너의 자식들)을 비교합니다.
 * app.js에서 컨테이너 단위로 diff할 때 사용합니다.
 *
 * @param {Array} oldVNodes - 이전 VNode 배열
 * @param {Array} newVNodes - 새로운 VNode 배열
 * @returns {Array} 패치 배열
 */
function diffContainers(oldVNodes, newVNodes) {
  return diffChildren(oldVNodes, newVNodes);
}

// ============================================================
// 6. Diff 결과를 사람이 읽을 수 있는 로그로 변환
// ============================================================

/**
 * Diff 결과를 로그 메시지 배열로 변환합니다.
 *
 * @param {Array} containerPatches - diffContainers의 결과
 * @param {string} path - 현재 경로 (디버깅용)
 * @returns {Array} 로그 메시지 문자열 배열
 */
function diffToLogs(containerPatches, path = 'root') {
  const logs = [];

  for (const { index, patch } of containerPatches) {
    const currentPath = `${path}[${index}]`;
    logs.push(...patchToLogs(patch, currentPath));
  }

  return logs;
}

function patchToLogs(patch, path) {
  const logs = [];

  switch (patch.type) {
    case PATCH_TYPES.CREATE:
      logs.push({
        type: 'create',
        message: `CREATE: ${path} — <${patch.newVNode.type === 'TEXT_NODE' ? 'text' : patch.newVNode.type}> 노드 추가`
      });
      break;

    case PATCH_TYPES.REMOVE:
      logs.push({
        type: 'remove',
        message: `REMOVE: ${path} — 노드 제거`
      });
      break;

    case PATCH_TYPES.REPLACE:
      logs.push({
        type: 'replace',
        message: `REPLACE: ${path} — <${patch.newVNode.type === 'TEXT_NODE' ? 'text' : patch.newVNode.type}>로 교체`
      });
      break;

    case PATCH_TYPES.UPDATE:
      if (patch.propPatches.length > 0) {
        for (const pp of patch.propPatches) {
          if (pp.action === 'SET') {
            logs.push({
              type: 'update',
              message: `UPDATE PROP: ${path} — ${pp.key}="${pp.value}"`
            });
          } else {
            logs.push({
              type: 'update',
              message: `REMOVE PROP: ${path} — ${pp.key} 속성 제거`
            });
          }
        }
      }
      if (patch.childPatches.length > 0) {
        for (const cp of patch.childPatches) {
          logs.push(...patchToLogs(cp.patch, `${path}[${cp.index}]`));
        }
      }
      break;
  }

  return logs;
}
