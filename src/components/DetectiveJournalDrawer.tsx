import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Edit3,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import {
  CaseData,
  CaseProgressState,
  JournalCategory,
  JournalEntry,
} from '../types/game';

interface DetectiveJournalDrawerProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  onClose: () => void;
  onAddEntry: (
    entry: Omit<JournalEntry, 'id' | 'createdAt'>,
    syncToNotes: boolean
  ) => void;
  onUpdateEntry: (
    entryId: string,
    updates: Partial<Pick<JournalEntry, 'category' | 'suspectId' | 'title' | 'content' | 'pinned'>>
  ) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateNotes: (notes: string) => void;
}

const CATEGORY_LABELS: Record<JournalCategory, string> = {
  observation: 'Observation',
  suspect_quirk: 'Suspect Quirk',
  theory: 'Personal Theory',
};

export const DetectiveJournalDrawer: React.FC<DetectiveJournalDrawerProps> = ({
  caseData,
  caseState,
  onClose,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateNotes,
}) => {
  const [viewMode, setViewMode] = useState<'entries' | 'notes'>('entries');
  const [filterCat, setFilterCat] = useState<'all' | JournalCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer state
  const [category, setCategory] = useState<JournalCategory>('observation');
  const [suspectId, setSuspectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [syncToNotes, setSyncToNotes] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const entries = caseState.journalEntries ?? [];

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
      .filter((item) => {
        if (filterCat !== 'all' && item.category !== filterCat) return false;
        if (!q) return true;
        const suspectName =
          caseData.suspects.find((s) => s.id === item.suspectId)?.name ?? '';
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          suspectName.toLowerCase().includes(q)
        );
      });
  }, [entries, filterCat, searchQuery, caseData.suspects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle && !cleanContent) return;

    noirAudio.playSfx('click');
    onAddEntry(
      {
        category,
        suspectId: suspectId || undefined,
        title: cleanTitle || CATEGORY_LABELS[category],
        content: cleanContent || cleanTitle,
        pinned: false,
      },
      syncToNotes
    );
    setTitle('');
    setContent('');
    setSuspectId('');
  };

  const startEdit = (item: JournalEntry) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const saveEdit = (itemId: string) => {
    noirAudio.playSfx('click');
    onUpdateEntry(itemId, {
      title: editTitle.trim() || 'Untitled Entry',
      content: editContent.trim(),
    });
    setEditingId(null);
  };

  const syncSingleToNotes = (item: JournalEntry) => {
    noirAudio.playSfx('click');
    const suspectName = item.suspectId
      ? caseData.suspects.find((s) => s.id === item.suspectId)?.name
      : undefined;
    const prefix = suspectName
      ? `[${CATEGORY_LABELS[item.category]} · ${suspectName}]`
      : `[${CATEGORY_LABELS[item.category]}]`;
    const line = `• ${prefix} ${item.title}: ${item.content}`;
    if (caseState.playerNotes.includes(line)) return;
    const updated = caseState.playerNotes
      ? `${caseState.playerNotes}\n${line}`
      : line;
    onUpdateNotes(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Detective Journal"
    >
      <div
        className="flex-1"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0E121A] text-[#E8ECF4] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="h-5 w-5 text-[#C9A24D] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#C9A24D] truncate">
                Case 0{caseData.number} · {caseData.title}
              </p>
              <h2 className="font-display text-2xl font-semibold text-white">
                Detective Journal
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Detective Journal"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="border-b border-white/10 bg-[#121620] px-5 py-2.5">
          <div className="flex gap-1.5 rounded-lg border border-white/10 bg-[#0B0D12] p-1">
            <button
              onClick={() => setViewMode('entries')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                viewMode === 'entries'
                  ? 'bg-[#C9A24D] text-[#0B0D12]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Field Entries ({entries.length})
            </button>
            <button
              onClick={() => setViewMode('notes')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                viewMode === 'notes'
                  ? 'bg-[#C9A24D] text-[#0B0D12]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Synced Case Notes
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {viewMode === 'entries' ? (
            <>
              {/* Composer Card */}
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-white/10 bg-[#121620] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Log New Entry
                  </span>
                  <div className="flex gap-1 rounded-lg border border-white/10 bg-[#0B0D12] p-0.5">
                    {(
                      ['observation', 'suspect_quirk', 'theory'] as JournalCategory[]
                    ).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                          category === cat
                            ? 'bg-[#C9A24D] text-[#0B0D12]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Headline (e.g. Muddy boot size 10)"
                    className="rounded-lg border border-white/10 bg-[#0B0D12] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#C9A24D] focus:outline-none"
                  />
                  <select
                    value={suspectId}
                    onChange={(e) => setSuspectId(e.target.value)}
                    aria-label="Tag suspect"
                    className="rounded-lg border border-white/10 bg-[#0B0D12] px-3 py-2 text-xs text-slate-200 focus:border-[#C9A24D] focus:outline-none"
                  >
                    <option value="">General Case Note</option>
                    {caseData.suspects.map((s) => (
                      <option key={s.id} value={s.id}>
                        Suspect: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder={
                    category === 'suspect_quirk'
                      ? 'Note nervous tells, repeated phrases, alibi gaps, or body language...'
                      : category === 'theory'
                      ? 'Outline your suspect hypothesis, motive chain, or planted clue theory...'
                      : 'Record scene observations, room details, or forensic leads...'
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0B0D12] p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#C9A24D] focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncToNotes}
                      onChange={(e) => setSyncToNotes(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#C9A24D]"
                    />
                    <span>Sync to Case File Notes</span>
                  </label>
                  <button
                    type="submit"
                    disabled={!title.trim() && !content.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A24D] px-4 py-2 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Journal</span>
                  </button>
                </div>
              </form>

              {/* Filter & Search Bar */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1 rounded-lg border border-white/10 bg-[#121620] p-1">
                    {(
                      [
                        ['all', 'All'],
                        ['observation', 'Observations'],
                        ['suspect_quirk', 'Quirks'],
                        ['theory', 'Theories'],
                      ] as ['all' | JournalCategory, string][]
                    ).map(([cat, label]) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCat(cat)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                          filterCat === cat
                            ? 'bg-[#C9A24D] text-[#0B0D12]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter notes..."
                      className="w-full rounded-lg border border-white/10 bg-[#121620] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#C9A24D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Journal Entries List */}
              {filteredEntries.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#121620] p-6 text-center space-y-1.5">
                  <p className="text-sm font-medium text-slate-200">
                    {entries.length === 0
                      ? 'Your Detective Journal is empty'
                      : 'No matching entries found'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Log scene observations, suspect quirks, or personal theories above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.map((item) => {
                    const suspect = caseData.suspects.find(
                      (s) => s.id === item.suspectId
                    );
                    const isEditing = editingId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 space-y-2 ${
                          item.pinned
                            ? 'border-[#C9A24D]/45 bg-[#161B26]'
                            : 'border-white/10 bg-[#121620]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-medium text-[#C9A24D]">
                              {CATEGORY_LABELS[item.category]}
                            </span>
                            {suspect && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-200">{suspect.name}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">{item.createdAt}</span>
                            {item.pinned && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-300">Pinned</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                noirAudio.playSfx('click');
                                onUpdateEntry(item.id, { pinned: !item.pinned });
                              }}
                              title={item.pinned ? 'Unpin entry' : 'Pin entry'}
                              className={`rounded p-1 transition-colors ${
                                item.pinned
                                  ? 'text-[#C9A24D]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => startEdit(item)}
                              title="Edit entry"
                              className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                noirAudio.playSfx('click');
                                onDeleteEntry(item.id);
                              }}
                              title="Delete entry"
                              className="rounded p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-1.5 text-xs font-medium text-white focus:border-[#C9A24D] focus:outline-none"
                            />
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-white/15 bg-[#0B0D12] p-2.5 text-xs text-slate-200 focus:border-[#C9A24D] focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#C9A24D] px-3 py-1.5 text-xs font-semibold text-[#0B0D12]"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-semibold text-white">
                              {item.title}
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                              {item.content}
                            </p>
                            <div className="pt-1">
                              <button
                                onClick={() => syncSingleToNotes(item)}
                                className="text-[11px] text-slate-400 hover:text-[#C9A24D] transition-colors"
                              >
                                Append to Case File Notes
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-300">
                  Two-way synced with your <span className="text-[#C9A24D]">Case File Detective Notes</span> and auto-logged interrogation leads.
                </p>
              </div>
              <textarea
                value={caseState.playerNotes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                rows={16}
                placeholder="Interrogation contradictions, safe codes, suspect alibis, and synced journal entries appear here..."
                className="w-full rounded-xl border border-white/10 bg-[#121620] p-4 text-xs leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-[#C9A24D] focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Changes save automatically and appear immediately in the Case File Dossier.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
