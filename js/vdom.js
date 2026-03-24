/**
 * vdom.js - Virtual DOM Core
 *
 * Virtual DOM 노드를 생성하고, 실제 DOM을 Virtual DOM으로 변환하며,
 * Virtual DOM을 실제 DOM으로 렌더링하는 핵심 모듈
 */

// ============================================================
// 1. Virtual DOM 노드 구조 정의
// ============================================================

/**
 * Virtual DOM 노드를 생성합니다.
 *
 * @param {string} type - 태그 이름 (예: 'div', 'p', 'span') 또는 'TEXT_NODE'
 * @param {Object} props - 속성 객체 (예: { id: 'app', class: 'container' })
 * @param {Array} children - 자식 VNode 배열
 * @returns {Object} VNode 객체
 */
function createVNode(type, props = {}, children = []) {
  return {
    type: type,
    props: props,
    children: children
  };
}

/**
 * 텍스트 노드용 Virtual DOM 노드를 생성합니다.
 *
 * @param {string} text - 텍스트 내용
 * @returns {Object} VNode 객체 (type: 'TEXT_NODE')
 */
function createTextVNode(text) {
  return {
    type: 'TEXT_NODE',
    props: {},
    children: [],
    value: text
  };
}

// ============================================================
// 2. 실제 DOM → Virtual DOM 변환
// ============================================================

/**
 * 실제 DOM 노드를 Virtual DOM 노드로 변환합니다.
 * 브라우저의 DOM 트리를 재귀적으로 순회하여 VNode 트리를 구축합니다.
 *
 * @param {Node} domNode - 변환할 실제 DOM 노드
 * @returns {Object|null} 변환된 VNode 또는 null
 */
function domToVNode(domNode) {
  // 텍스트 노드 처리
  if (domNode.nodeType === Node.TEXT_NODE) {
    const text = domNode.textContent;
    // 공백만 있는 텍스트 노드는 무시하지 않고 포함
    // (단, 완전히 비어있는 줄바꿈만 있는 경우 트림)
    if (text.trim() === '') {
      return null;
    }
    return createTextVNode(text);
  }

  // 요소 노드만 처리
  if (domNode.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  // 태그 이름
  const type = domNode.tagName.toLowerCase();

  // 속성(props) 추출
  const props = {};
  for (const attr of domNode.attributes) {
    props[attr.name] = attr.value;
  }

  // 자식 노드 재귀 변환
  const children = [];
  for (const child of domNode.childNodes) {
    const vChild = domToVNode(child);
    if (vChild !== null) {
      children.push(vChild);
    }
  }

  return createVNode(type, props, children);
}

// ============================================================
// 3. Virtual DOM → 실제 DOM 렌더링
// ============================================================

/**
 * Virtual DOM 노드를 실제 DOM 노드로 변환(렌더링)합니다.
 *
 * @param {Object} vnode - 렌더링할 VNode
 * @returns {Node} 생성된 실제 DOM 노드
 */
function renderVNode(vnode) {
  // 텍스트 노드
  if (vnode.type === 'TEXT_NODE') {
    return document.createTextNode(vnode.value);
  }

  // 요소 노드 생성
  const el = document.createElement(vnode.type);

  // 속성 적용
  for (const [key, value] of Object.entries(vnode.props)) {
    el.setAttribute(key, value);
  }

  // 자식 노드 재귀 렌더링
  for (const child of vnode.children) {
    el.appendChild(renderVNode(child));
  }

  return el;
}

/**
 * Virtual DOM을 대상 컨테이너에 렌더링합니다.
 * 기존 내용을 모두 교체합니다.
 *
 * @param {Object} vnode - 렌더링할 VNode (또는 VNode 배열의 래퍼)
 * @param {HTMLElement} container - 대상 컨테이너 요소
 */
function renderToContainer(vnodes, container) {
  container.innerHTML = '';
  if (Array.isArray(vnodes)) {
    for (const vnode of vnodes) {
      container.appendChild(renderVNode(vnode));
    }
  } else {
    container.appendChild(renderVNode(vnodes));
  }
}

// ============================================================
// 4. Virtual DOM 직렬화 (Deep Clone)
// ============================================================

/**
 * VNode 트리를 깊은 복사합니다.
 * State History에 저장할 때 참조 공유를 방지합니다.
 *
 * @param {Object|Array} vnode - 복사할 VNode 또는 VNode 배열
 * @returns {Object|Array} 복사된 VNode
 */
function cloneVNode(vnode) {
  if (Array.isArray(vnode)) {
    return vnode.map(v => cloneVNode(v));
  }

  if (vnode.type === 'TEXT_NODE') {
    return createTextVNode(vnode.value);
  }

  return createVNode(
    vnode.type,
    { ...vnode.props },
    vnode.children.map(child => cloneVNode(child))
  );
}

/**
 * 컨테이너의 모든 자식 요소를 VNode 배열로 변환합니다.
 *
 * @param {HTMLElement} container - 대상 컨테이너
 * @returns {Array} VNode 배열
 */
function containerToVNodes(container) {
  const vnodes = [];
  for (const child of container.childNodes) {
    const vnode = domToVNode(child);
    if (vnode !== null) {
      vnodes.push(vnode);
    }
  }
  return vnodes;
}
