/**
 * app.js - Main Application
 *
 * Virtual DOM 시스템의 모든 모듈을 연결하고,
 * UI 이벤트를 처리하는 메인 애플리케이션 로직
 *
 * 테스트 영역: HTML 소스 코드 에디터 (textarea)
 * - Code 모드: HTML 소스를 직접 편집
 * - Preview 모드: 렌더링된 결과 미리보기
 */

(function () {
  'use strict';

  // ============================================================
  // 샘플 HTML — 초기 콘텐츠
  // ============================================================
  var SAMPLE_HTML = '<div class="card" data-id="1"><h3>Virtual DOM 프로젝트</h3><p>이 프로젝트는 <strong>React</strong>의 핵심 개념인 Virtual DOM과 Diff 알고리즘을 구현합니다.</p><ul class="feature-list"><li class="feature-item active">DOM → Virtual DOM 변환</li><li class="feature-item">Diff 알고리즘</li><li class="feature-item">Patch 시스템</li></ul><div class="card-footer"><span class="tag">Vanilla JS</span><span class="tag">No Framework</span><button class="action-btn">자세히 보기</button></div></div><div class="card" data-id="2"><h3>학습 포인트</h3><p>실제 DOM 조작이 느린 이유와 Virtual DOM이 이를 어떻게 해결하는지 알아봅니다.</p><div class="progress-bar"><div class="progress-fill" style="width:70%"></div></div><span class="progress-text">진행률: 70%</span></div>';

  // ============================================================
  // DOM 요소 참조
  // ============================================================
  var actualArea, editorEl, previewEl, logEl;
  var history;
  var currentVNodes = [];
  var currentMode = 'code';

  // ============================================================
  // HTML Pretty Print — 소스 코드 포맷팅
  // ============================================================

  /**
   * DOM 노드의 자식들을 보기 좋은 HTML 소스로 변환
   */
  function prettyPrint(node, indent) {
    var result = '';
    var pad = '';
    for (var p = 0; p < indent; p++) pad += '  ';

    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        var txt = child.textContent.trim();
        if (txt) result += pad + txt + '\n';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        var tag = child.tagName.toLowerCase();
        var attrs = '';
        for (var a = 0; a < child.attributes.length; a++) {
          attrs += ' ' + child.attributes[a].name + '="' + child.attributes[a].value + '"';
        }
        // 자식이 텍스트 하나만 있으면 한 줄로
        if (child.childNodes.length === 1 && child.childNodes[0].nodeType === Node.TEXT_NODE) {
          result += pad + '<' + tag + attrs + '>' + child.textContent.trim() + '</' + tag + '>\n';
        } else if (child.childNodes.length === 0) {
          var selfClose = ['br', 'hr', 'img', 'input'];
          if (selfClose.indexOf(tag) >= 0) {
            result += pad + '<' + tag + attrs + '>\n';
          } else {
            result += pad + '<' + tag + attrs + '></' + tag + '>\n';
          }
        } else {
          result += pad + '<' + tag + attrs + '>\n';
          result += prettyPrint(child, indent + 1);
          result += pad + '</' + tag + '>\n';
        }
      }
    }
    return result;
  }

  /**
   * HTML 소스 문자열 → VNode 배열로 변환
   */
  function htmlToVNodes(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return containerToVNodes(tmp);
  }

  /**
   * VNode 배열 → 포맷된 HTML 소스 문자열로 변환
   */
  function vnodesToHTML(vnodes) {
    var tmp = document.createElement('div');
    for (var i = 0; i < vnodes.length; i++) {
      tmp.appendChild(renderVNode(vnodes[i]));
    }
    return prettyPrint(tmp, 0);
  }

  // ============================================================
  // Code/Preview 모드 전환
  // ============================================================

  window.setMode = function (mode) {
    currentMode = mode;
    var btnCode = document.getElementById('btn-mode-code');
    var btnPrev = document.getElementById('btn-mode-preview');
    if (mode === 'code') {
      editorEl.style.display = '';
      previewEl.style.display = 'none';
      btnCode.classList.add('active');
      btnPrev.classList.remove('active');
    } else {
      editorEl.style.display = 'none';
      previewEl.style.display = '';
      previewEl.innerHTML = editorEl.value;
      btnCode.classList.remove('active');
      btnPrev.classList.add('active');
    }
  };

  // ============================================================
  // Diff Log
  // ============================================================

  function addLog(type, message) {
    var entry = document.createElement('div');
    entry.className = 'log-entry log-' + type;

    if (type === 'divider') {
      entry.textContent = message;
    } else {
      var now = new Date();
      var t = ('0' + now.getHours()).slice(-2) + ':' +
              ('0' + now.getMinutes()).slice(-2) + ':' +
              ('0' + now.getSeconds()).slice(-2);
      entry.innerHTML = '<span class="log-time">[' + t + ']</span> ' + message;
    }

    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ============================================================
  // UI 업데이트
  // ============================================================

  function updateUI() {
    document.getElementById('btn-undo').disabled = !history.canUndo();
    document.getElementById('btn-redo').disabled = !history.canRedo();
    var info = history.getInfo();
    document.getElementById('history-indicator').textContent =
      'State: ' + info.current + ' / ' + info.total;
  }

  // ============================================================
  // Patch 버튼 핸들러
  // ============================================================

  function handlePatch() {
    // 1. 에디터의 HTML 소스 → Virtual DOM
    var newVNodes = htmlToVNodes(editorEl.value);

    // 2. Diff: 이전 상태와 비교
    var patches = diffContainers(currentVNodes, newVNodes);

    if (patches.length === 0) {
      addLog('info', '변경 사항이 없습니다.');
      return;
    }

    // 3. 로그 출력
    var info = history.getInfo();
    addLog('divider', '── Patch #' + info.total + ' ──');
    var logs = diffToLogs(patches);
    for (var i = 0; i < logs.length; i++) {
      addLog(logs[i].type, logs[i].message);
    }
    addLog('info', '총 ' + logs.length + '개의 변경 사항 적용');

    // 4. 실제 영역에 패치 적용 (변경된 부분만!)
    patchContainer(actualArea, patches);

    // 5. 상태 갱신 및 히스토리 저장
    currentVNodes = cloneVNode(newVNodes);
    history.push(currentVNodes);
    updateUI();

    // Preview 모드면 미리보기도 갱신
    if (currentMode === 'preview') {
      previewEl.innerHTML = editorEl.value;
    }
  }

  // ============================================================
  // 뒤로가기 / 앞으로가기 핸들러
  // ============================================================

  function handleUndo() {
    var prev = history.undo();
    if (!prev) return;

    currentVNodes = prev;
    renderToContainer(currentVNodes, actualArea);
    editorEl.value = vnodesToHTML(currentVNodes);
    if (currentMode === 'preview') previewEl.innerHTML = editorEl.value;

    var info = history.getInfo();
    addLog('info', '⟵ 뒤로가기: State ' + info.current + ' / ' + info.total);
    updateUI();
  }

  function handleRedo() {
    var next = history.redo();
    if (!next) return;

    currentVNodes = next;
    renderToContainer(currentVNodes, actualArea);
    editorEl.value = vnodesToHTML(currentVNodes);
    if (currentMode === 'preview') previewEl.innerHTML = editorEl.value;

    var info = history.getInfo();
    addLog('info', '⟶ 앞으로가기: State ' + info.current + ' / ' + info.total);
    updateUI();
  }

  // ============================================================
  // 초기화
  // ============================================================

  function init() {
    actualArea = document.getElementById('actual-area');
    editorEl = document.getElementById('test-editor');
    previewEl = document.getElementById('test-preview');
    logEl = document.getElementById('diff-log');

    history = new StateHistory();

    // 1. 샘플 HTML → 실제 영역
    actualArea.innerHTML = SAMPLE_HTML;

    // 2. 실제 영역 DOM → Virtual DOM
    currentVNodes = containerToVNodes(actualArea);

    // 3. Virtual DOM → 에디터에 포맷된 HTML 소스 표시
    editorEl.value = vnodesToHTML(currentVNodes);

    // 4. 히스토리 초기 상태 저장
    history.push(currentVNodes);
    updateUI();

    // 5. 이벤트 리스너
    document.getElementById('btn-patch').onclick = handlePatch;
    document.getElementById('btn-undo').onclick = handleUndo;
    document.getElementById('btn-redo').onclick = handleRedo;

    // Tab 키로 들여쓰기 지원
    editorEl.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = editorEl.selectionStart;
        var end = editorEl.selectionEnd;
        editorEl.value = editorEl.value.substring(0, start) + '  ' + editorEl.value.substring(end);
        editorEl.selectionStart = editorEl.selectionEnd = start + 2;
      }
    });

    document.getElementById('btn-clear').onclick = function () {
      logEl.innerHTML = '';
      addLog('info', '로그 초기화');
    };

    addLog('info', '초기화 완료! 테스트 영역의 HTML을 자유롭게 수정하고 Patch를 눌러보세요.');
    addLog('info', '태그 추가/삭제, 속성 변경, 순서 변경 등 무엇이든 가능합니다.');
  }

  // ============================================================
  // 앱 시작
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
