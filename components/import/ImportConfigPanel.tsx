import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { LabeledSegment } from '@/components/ui/LabeledSegment';
import { type ExportFormat } from '@/lib/export/download';
import { type ImportMode, type ConflictPolicy } from '@/lib/import/merge';
import { FORMATS, IMPORT_MODES, CONFLICT_POLICIES } from '@/lib/import/constants';

interface Props {
  format: ExportFormat;
  onFormatChange: (v: ExportFormat) => void;
  importMode: ImportMode;
  onImportModeChange: (v: ImportMode) => void;
  conflictPolicy: ConflictPolicy;
  onConflictPolicyChange: (v: ConflictPolicy) => void;
}

export function ImportConfigPanel({
  format,
  onFormatChange,
  importMode,
  onImportModeChange,
  conflictPolicy,
  onConflictPolicyChange,
}: Props) {
  return (
    <View className="mb-4 gap-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <LabeledSegment
        label="Format"
        options={FORMATS.map((f) => ({ value: f.key, label: f.label }))}
        value={format}
        onChange={(v) => onFormatChange(v)}
      />
      <LabeledSegment
        label="Import mode"
        options={IMPORT_MODES.map((m) => ({ value: m.key, label: m.label }))}
        value={importMode}
        onChange={(v) => onImportModeChange(v)}
      />
      <LabeledSegment
        label="If data already exists"
        options={CONFLICT_POLICIES.map((cp) => ({ value: cp.key, label: cp.label }))}
        value={conflictPolicy}
        onChange={(v) => onConflictPolicyChange(v)}
      />
    </View>
  );
}
