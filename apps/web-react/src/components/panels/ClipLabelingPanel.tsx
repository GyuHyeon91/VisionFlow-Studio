import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Camera, Check, ClipboardList, RefreshCw, Save, Trash2, WandSparkles } from 'lucide-react';
import DataCard from './DataCard';
import { useStore } from '@/store/useStore';
import {
  detectFrame, frameUrl, getDatasetClasses, listClips, saveClipLabel,
  type ClipInfo, type DetectionLike, type LabelBox,
} from '@/services/labelingApi';

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function ClipLabelingPanel() {
  const pushToast = useStore((s) => s.pushToast);
  const [clips, setClips] = useState<ClipInfo[]>([]);
  const [name, setName] = useState('');
  const [info, setInfo] = useState<ClipInfo | null>(null);
  const [index, setIndex] = useState(0);
  const [datasetId, setDatasetId] = useState('capture');
  const [classes, setClasses] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<number, LabelBox[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<LabelBox['bbox'] | null>(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const boxes = labels[index] ?? [];

  const refreshClips = useCallback(async () => {
    try {
      const list = await listClips();
      setClips(list);
      setName((prev) => (list.some((c) => c.name === prev) ? prev : list[0]?.name ?? ''));
    } catch { /* 백엔드 미실행 시 무시 */ }
  }, []);

  const refreshClasses = useCallback(async () => {
    try { setClasses(await getDatasetClasses(datasetId)); } catch { /* ignore */ }
  }, [datasetId]);

  useEffect(() => { void refreshClips(); }, [refreshClips]);
  useEffect(() => { void refreshClasses(); }, [refreshClasses]);

  useEffect(() => {
    if (!name) { setInfo(null); return; }
    const found = clips.find((c) => c.name === name);
    if (found) setInfo(found);
    setIndex(0);
    setLabels({});
    setSelected(null);
  }, [name, clips]);

  const updateBoxes = (next: LabelBox[]) => {
    setLabels((prev) => ({ ...prev, [index]: next }));
  };

  const pointOf = (e: ReactPointerEvent): { x: number; y: number } => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !info) return;
    const p = pointOf(e);
    dragStart.current = p;
    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
    setSelected(null);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const p = pointOf(e);
    const s = dragStart.current;
    setDrawing({
      x: Math.min(s.x, p.x), y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y),
    });
  };

  const onPointerUp = () => {
    if (drawing && drawing.w > 1.5 && drawing.h > 1.5) {
      const box: LabelBox = { id: newId(), label: classes[0] ?? 'person', bbox: drawing };
      updateBoxes([...boxes, box]);
      setSelected(box.id);
    }
    dragStart.current = null;
    setDrawing(null);
  };

  const handleAutoDetect = async () => {
    if (!name) return;
    setBusy(true);
    try {
      const results = await detectFrame(name, index, 0.3);
      if (!results.length) { pushToast('이 프레임에서 감지된 객체가 없습니다.', 'warning'); return; }
      updateBoxes(results.map((d) => ({ id: newId(), label: d.label, bbox: d.bbox, confidence: d.confidence })));
      pushToast(`자동 감지 ${results.length}건을 불러왔습니다. 클래스와 BBox를 확인하세요.`, 'info');
    } catch (err) {
      pushToast(`자동 감지 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleSave = async (negative: boolean) => {
    if (!name) return;
    setBusy(true);
    try {
      const detections: DetectionLike[] = negative ? [] : boxes.map((b) => ({
        label: b.label, bbox: b.bbox, confidence: b.confidence ?? 1,
      }));
      const res = await saveClipLabel(name, datasetId, index, detections);
      pushToast(
        res.negative ? '라벨 없는 네거티브 샘플로 저장했습니다.' : `라벨 ${res.saved}건을 ${datasetId}에 저장했습니다.`,
        'success',
      );
    } catch (err) {
      pushToast(`저장 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const selectedBox = boxes.find((b) => b.id === selected);

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="labeling-clips"
        title="저장된 위험 클립"
        description="사고·위험 감지 시점 전후로 자동 저장된 클립입니다. 프레임을 선택해 라벨을 수정할 수 있습니다."
        icon={<ClipboardList size={15} />}
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '5px 9px' }} onClick={() => void refreshClips()}><RefreshCw size={11} /> 새로고침</button>}
        bodyClassName="card-pad"
      >
        {clips.length === 0 ? (
          <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
            아직 저장된 클립이 없습니다. 영상을 분석하거나 실시간 스트림에서 위험이 감지되면 클립이 자동 저장되고 여기에 표시됩니다.
          </div>
        ) : (
          <div className="clip-list">
            {clips.map((c) => (
              <button key={c.name} className={`clip-item ${name === c.name ? 'active' : ''}`} onClick={() => setName(c.name)}>
                <span className="mono">{c.name}</span>
                <span className="faint">{c.frames}프레임 · {c.seconds}초 · {c.width}×{c.height}</span>
              </button>
            ))}
          </div>
        )}
        <div className="divider" />
        <div className="field">
          <div className="field-label"><span>저장 대상 데이터셋</span></div>
          <input
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
          />
        </div>
        <div className="text-xs faint" style={{ lineHeight: 1.6 }}>
          라벨은 YOLO 형식(.txt)으로 저장되며, BBox가 없는 프레임은 오탐 학습용 네거티브 샘플이 됩니다.
        </div>
      </DataCard>

      <DataCard
        dataKey="labeling-frame"
        title="프레임 BBox 편집"
        description="이미지 위를 드래그해 BBox를 그리고, 오른쪽에서 클래스를 수정합니다. 자동 감지 결과를 불러와 다듬을 수도 있습니다."
        icon={<Camera size={15} />}
        bodyClassName="card-pad"
      >
        {!info || !name ? (
          <div className="text-xs faint">위쪽에서 클립을 선택하면 프레임이 표시됩니다.</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button className="ghost-btn" disabled={index <= 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>◀ 이전</button>
              <input
                type="range" min={0} max={Math.max(0, info.frames - 1)} value={index}
                style={{ flex: 1, ['--fill' as string]: `${info.frames > 1 ? index / (info.frames - 1) * 100 : 0}%` }}
                onChange={(e) => { setIndex(Number(e.target.value)); setSelected(null); }}
              />
              <button className="ghost-btn" disabled={index >= info.frames - 1} onClick={() => setIndex((v) => Math.min(info.frames - 1, v + 1))}>다음 ▶</button>
              <span className="mono text-xs">{index + 1}/{info.frames}</span>
            </div>
            <div
              ref={wrapRef}
              className="label-canvas"
              style={{ aspectRatio: `${info.width || 16} / ${info.height || 9}` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img src={frameUrl(name, index)} alt={`frame ${index}`} draggable={false} />
              {boxes.map((b) => (
                <div
                  key={b.id}
                  className={`label-box ${selected === b.id ? 'selected' : ''}`}
                  style={{ left: `${b.bbox.x}%`, top: `${b.bbox.y}%`, width: `${b.bbox.w}%`, height: `${b.bbox.h}%` }}
                  onPointerDown={(e) => { e.stopPropagation(); setSelected(b.id); }}
                >
                  <span className="label-box-tag">{b.label}{b.confidence !== undefined ? ` ${(b.confidence * 100).toFixed(0)}%` : ''}</span>
                </div>
              ))}
              {drawing && <div className="label-box drawing" style={{ left: `${drawing.x}%`, top: `${drawing.y}%`, width: `${drawing.w}%`, height: `${drawing.h}%` }} />}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="ghost-btn" style={{ fontSize: 11 }} disabled={busy} onClick={() => void handleAutoDetect()}>
                <WandSparkles size={12} /> 자동 감지 불러오기
              </button>
              <button className="ghost-btn" style={{ fontSize: 11 }} onClick={() => { setSelected(null); updateBoxes(boxes.filter((b) => b.id !== selected)); }}>
                <Trash2 size={12} /> 선택 삭제
              </button>
              <button className="ghost-btn" style={{ fontSize: 11 }} onClick={() => { updateBoxes([]); setSelected(null); }}>전체 지우기</button>
            </div>
          </>
        )}
      </DataCard>

      <DataCard
        dataKey="labeling-boxes"
        title="라벨 목록 및 저장"
        description="현재 프레임에 지정된 객체와 클래스입니다. 클래스를 고친 뒤 저장하면 학습 데이터에 반영됩니다."
        icon={<Check size={15} />}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">이 프레임 BBox</span><b className="mono accent">{boxes.length}건</b></div>
        <div className="divider" />
        {boxes.length === 0 ? (
          <div className="text-xs faint">BBox가 없습니다. 네거티브 샘플로 저장할 수 있습니다.</div>
        ) : (
          <div className="clip-list">
            {boxes.map((b, i) => (
              <button key={b.id} className={`clip-item ${selected === b.id ? 'active' : ''}`} onClick={() => setSelected(b.id)}>
                <span className="mono">#{i + 1} {b.label}</span>
                <span className="faint mono">x{b.bbox.x.toFixed(0)} y{b.bbox.y.toFixed(0)} w{b.bbox.w.toFixed(0)} h{b.bbox.h.toFixed(0)}</span>
              </button>
            ))}
          </div>
        )}
        {selectedBox && (
          <div className="field mt-2">
            <div className="field-label"><span>선택된 객체 클래스</span></div>
            <select
              className="ghost-btn full"
              style={{ cursor: 'pointer', justifyContent: 'flex-start', color: 'var(--text)' }}
              value={selectedBox.label}
              onChange={(e) => updateBoxes(boxes.map((b) => b.id === selectedBox.id ? { ...b, label: e.target.value } : b))}
            >
              {(classes.length ? classes : [selectedBox.label]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="divider" />
        <button className="primary-btn full" disabled={busy || !name || boxes.length === 0} onClick={() => void handleSave(false)}>
          <Save size={14} /> BBox 라벨 저장
        </button>
        <button className="ghost-btn full mt-2" disabled={busy || !name} onClick={() => void handleSave(true)}>
          <Trash2 size={12} /> 네거티브 샘플로 저장
        </button>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          프레임별 편집 내용은 브라우저에 임시 보관되며 클립을 바꾸면 초기화됩니다. 저장 전에 클래스와 좌표를 확인하세요.
        </div>
      </DataCard>
    </div>
  );
}
