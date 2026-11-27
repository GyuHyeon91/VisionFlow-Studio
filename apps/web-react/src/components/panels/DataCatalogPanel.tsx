import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardCopy, Database, FolderTree, RefreshCw, Server, UploadCloud } from 'lucide-react';
import { backendBaseUrl } from '@/config';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';

interface CatalogItem {
  group: string;
  name: string;
  path: string;
  kind: string;
  source: string;
  endpoint: string;
  desc: string;
  status: 'exists' | 'pending' | 'memory';
}
interface CatalogData {
  groups: string[];
  items: CatalogItem[];
  total: number;
  root: string;
  note: string;
}
interface ExternalDataset {
  id: string;
  name: string;
  source: string;
  purpose: string;
  scale: string;
  labels: string[];
  format: string;
  note: string;
}
interface ExternalData {
  datasets: ExternalDataset[];
  importDir: string;
  note: string;
  imported: Array<{ name: string; path: string; files: number }>;
}

const STATUS_LABEL: Record<CatalogItem['status'], string> = {
  exists: '생성됨', pending: '대기', memory: '메모리',
};

export default function DataCatalogPanel() {
  const pushToast = useStore((s) => s.pushToast);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [external, setExternal] = useState<ExternalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = backendBaseUrl();
      const [cRes, eRes] = await Promise.all([
        fetch(`${base}/api/data-catalog`),
        fetch(`${base}/api/external-datasets`),
      ]);
      if (!cRes.ok || !eRes.ok) throw new Error(`API 응답 오류 (${cRes.status}/${eRes.status})`);
      setCatalog(await cRes.json() as CatalogData);
      setExternal(await eRes.json() as ExternalData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of catalog?.items ?? []) {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return map;
  }, [catalog]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast('경로를 클립보드에 복사했습니다.', 'success');
    } catch {
      pushToast('클립보드 복사에 실패했습니다.', 'warning');
    }
  };

  if (loading) {
    return (
      <div className="card card-pad">
        <div className="empty-state"><Database size={22} /><b>데이터 카탈로그를 불러오는 중...</b></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card card-pad">
        <div className="empty-state">
          <Server size={22} /><b>카탈로그 조회 실패</b>
          <div className="text-xs">{error} · 백엔드({backendBaseUrl()})가 실행 중인지 확인하세요.</div>
          <button className="primary-btn mt-4" onClick={() => void load()}><RefreshCw size={14} /> 다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <DataCard
        dataKey="catalog-overview"
        title="데이터 카탈로그 개요"
        description="프로젝트가 생성·사용하는 데이터의 종류와 저장 경로를 서버에서 조회한 결과입니다."
        icon={<FolderTree size={15} />}
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => void load()}><RefreshCw size={12} /> 새로고침</button>}
        bodyClassName="card-pad"
      >
        <div className="metric-row">
          <div className="metric-cell"><span>데이터 항목</span><b>{catalog?.total ?? 0}</b></div>
          <div className="metric-cell"><span>그룹</span><b>{catalog?.groups.length ?? 0}</b></div>
          <div className="metric-cell"><span>외부 데이터셋</span><b>{external?.datasets.length ?? 0}</b></div>
        </div>
        <div className="catalog-root">
          <span>프로젝트 루트</span>
          <code>{catalog?.root}</code>
          <button className="icon-btn" title="루트 경로 복사" onClick={() => void copy(catalog?.root ?? '')}><ClipboardCopy size={13} /></button>
        </div>
        <div className="text-xs faint" style={{ marginTop: 8 }}>{catalog?.note}</div>
      </DataCard>

      {[...grouped.entries()].map(([group, items]) => (
        <DataCard
          key={group}
          dataKey={`catalog-group-${group}`}
          title={`${group} 데이터`}
          description={`${group} 그룹에 속한 ${items.length}개 데이터의 경로·생성 주체·연결 API입니다.`}
          icon={<Database size={15} />}
          bodyClassName="card-pad"
        >
          <div className="catalog-list">
            {items.map((item) => (
              <div className="catalog-row" key={`${item.group}-${item.name}`}>
                <div className="catalog-row-main">
                  <div className="flex items-center gap-2">
                    <b className="text-sm">{item.name}</b>
                    <span className="catalog-kind">{item.kind}</span>
                    <span className={`catalog-status ${item.status}`}>
                      {item.status === 'exists' ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <div className="catalog-path">
                    <code>{item.path}</code>
                    <button className="icon-btn" title="경로 복사" onClick={() => void copy(item.path)}><ClipboardCopy size={12} /></button>
                  </div>
                  <div className="text-xs faint">{item.desc}</div>
                </div>
                <div className="catalog-meta">
                  <div><span>생성 주체</span><b>{item.source}</b></div>
                  <div><span>연결 API</span><code>{item.endpoint}</code></div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      ))}

      <DataCard
        dataKey="catalog-external"
        title="외부 공개 데이터셋"
        description="학습에 활용할 수 있는 공개 사고·이상행동 데이터셋 카탈로그입니다. 데이터 자체는 포함되지 않습니다."
        icon={<UploadCloud size={15} />}
        bodyClassName="card-pad"
      >
        <div className="catalog-root" style={{ marginBottom: 10 }}>
          <span>가져오기 경로</span>
          <code>{external?.importDir}</code>
          <button className="icon-btn" title="경로 복사" onClick={() => void copy(external?.importDir ?? '')}><ClipboardCopy size={13} /></button>
        </div>
        <div className="catalog-list">
          {(external?.datasets ?? []).map((ds) => (
            <div className="catalog-row" key={ds.id}>
              <div className="catalog-row-main">
                <div className="flex items-center gap-2">
                  <b className="text-sm">{ds.name}</b>
                  <span className="catalog-kind">{ds.source}</span>
                </div>
                <div className="text-xs">{ds.purpose} · {ds.scale}</div>
                <div className="text-xs faint">{ds.format} · 라벨: {ds.labels.join(', ')}</div>
                <div className="text-xs faint">{ds.note}</div>
              </div>
              <div className="catalog-meta">
                <div><span>데이터셋 ID</span><code>{ds.id}</code></div>
              </div>
            </div>
          ))}
        </div>
        {!!external?.imported.length && (
          <div className="text-xs faint" style={{ marginTop: 10 }}>
            로컬 적재: {external.imported.map((i) => `${i.name}(${i.files}개 파일)`).join(', ')}
          </div>
        )}
        <div className="text-xs faint" style={{ marginTop: 8 }}>{external?.note}</div>
      </DataCard>
    </div>
  );
}
