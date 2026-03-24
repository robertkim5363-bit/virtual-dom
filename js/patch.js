/**
 * patch.js - Patch System
 *
 * Diff 알고리즘이 찾아낸 변경 사항(patches)을 실제 DOM에 반영합니다.
 * 변경된 부분만 업데이트하여 불필요한 Reflow/Repaint를 최소화합니다.
 */

// ============================================================
// 1. 메인 Patch 함수
// ============================================================

/**
 * 단일 패치를 실제 DOM 노드에 적용합니다.
 *
 * @param {Node} parentNode - 부모 DOM 노드
 * @param {Node|null} domNode - 패치 대상 DOM 노드 (CREATE 시 null)
 * @param {Object} patch - diff()가 반환한 패치 객체
 * @returns {Node|null} 패치 후의 DOM 노드
 */
function applyPatch(parentNode, domNode, patch) {
  switch (patch.type) {
    case PATCH_TYPES.CREATE: {
      const newNode = renderVNode(patch.newVNode);
      parentNode.appendChild(newNode);
      return newNode;
    }

    case PATCH_TYPES.REMOVE: {
      if (domNode && parentNode.contains(domNode)) {
        parentNode.removeChild(domNode);
      }
      return null;
    }

    case PATCH_TYPES.REPLACE: {
      const newNode = renderVNode(patch.newVNode);
      if (domNode && parentNode.contains(domNode)) {
        parentNode.replaceChild(newNode, domNode);
      } else {
        parentNode.appendChild(newNode);
      }
      return newNode;
    }

    case PATCH_TYPES.UPDATE: {
      // Props 패치 적용
      applyPropPatches(domNode, patch.propPatches);

      // Children 패치 적용
      applyChildPatches(domNode, patch.childPatches);

      return domNode;
    }

    default:
      return domNode;
  }
}

// ============================================================
// 2. Props 패치 적용
// ============================================================

/**
 * 속성 변경 사항을 DOM 요소에 적용합니다.
 *
 * @param {HTMLElement} domNode - 대상 DOM 요소
 * @param {Array} propPatches - 속성 패치 배열
 */
function applyPropPatches(domNode, propPatches) {
  if (!domNode || domNode.nodeType !== Node.ELEMENT_NODE) return;

  for (const pp of propPatches) {
    if (pp.action === 'SET') {
      domNode.setAttribute(pp.key, pp.value);

      // style 속성은 직접 적용
      if (pp.key === 'style') {
        domNode.style.cssText = pp.value;
      }
    } else if (pp.action === 'REMOVE') {
      domNode.removeAttribute(pp.key);
    }
  }
}

// ============================================================
// 3. Children 패치 적용
// ============================================================

/**
 * 자식 노드 변경 사항을 DOM에 적용합니다.
 * REMOVE 패치는 인덱스가 큰 것부터 역순으로 적용하여 인덱스 밀림을 방지합니다.
 *
 * @param {HTMLElement} parentNode - 부모 DOM 요소
 * @param {Array} childPatches - 자식 패치 배열 [{ index, patch }]
 */
function applyChildPatches(parentNode, childPatches) {
  if (!parentNode || childPatches.length === 0) return;

  // 실제 자식 노드 목록 (텍스트 노드 포함, 공백 전용 노드 제외)
  const childNodes = getSignificantChildren(parentNode);

  // REMOVE 패치를 먼저 분리하여 역순 처리
  const removePatches = [];
  const otherPatches = [];

  for (const cp of childPatches) {
    if (cp.patch.type === PATCH_TYPES.REMOVE) {
      removePatches.push(cp);
    } else {
      otherPatches.push(cp);
    }
  }

  // REMOVE를 역순으로 적용 (인덱스 밀림 방지)
  removePatches.sort((a, b) => b.index - a.index);
  for (const { index } of removePatches) {
    const child = childNodes[index];
    if (child) {
      parentNode.removeChild(child);
    }
  }

  // 나머지 패치 적용 (CREATE, REPLACE, UPDATE)
  // REMOVE 후 자식 목록이 바뀌었으므로 다시 가져옴
  for (const { index, patch } of otherPatches) {
    const currentChildren = getSignificantChildren(parentNode);

    if (patch.type === PATCH_TYPES.CREATE) {
      const newNode = renderVNode(patch.newVNode);
      if (index >= currentChildren.length) {
        parentNode.appendChild(newNode);
      } else {
        parentNode.insertBefore(newNode, currentChildren[index]);
      }
    } else {
      const targetNode = currentChildren[index];
      if (targetNode) {
        applyPatch(parentNode, targetNode, patch);
      }
    }
  }
}

// ============================================================
// 4. 컨테이너 수준 패치 적용
// ============================================================

/**
 * 컨테이너 수준의 패치를 적용합니다.
 * app.js에서 "실제 영역"에 변경 사항을 반영할 때 사용합니다.
 *
 * @param {HTMLElement} container - 대상 컨테이너 요소
 * @param {Array} containerPatches - diffContainers()의 결과
 */
function patchContainer(container, containerPatches) {
  applyChildPatches(container, containerPatches);
}

// ============================================================
// 5. 유틸리티
// ============================================================

/**
 * 부모 요소의 "유효한" 자식 노드만 반환합니다.
 * (공백만 있는 텍스트 노드 제외)
 *
 * @param {HTMLElement} parent
 * @returns {Array<Node>}
 */
function getSignificantChildren(parent) {
  const result = [];
  for (const child of parent.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() === '') {
      continue;
    }
    result.push(child);
  }
  return result;
}
