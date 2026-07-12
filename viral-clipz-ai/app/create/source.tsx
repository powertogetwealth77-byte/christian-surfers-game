import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  CloudDownload,
  FileVideo,
  FolderDown,
  Link2,
  Mic2,
  MonitorPlay,
  Upload,
  Video,
} from 'lucide-react-native';
import { CreateStep } from '@/components/feature/CreateStep';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PermissionDeniedState } from '@/components/ui/States';
import { track } from '@/lib/analytics';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import { colors, spacing } from '@/theme/tokens';
import type { SourceKind } from '@/types/entities';

interface SourceOption {
  kind: SourceKind;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  ready: boolean;
}

const OPTIONS: SourceOption[] = [
  { kind: 'upload', label: 'Upload from device', hint: 'Pick a video from your library', icon: Upload, ready: true },
  { kind: 'record', label: 'Record video', hint: 'Capture directly with your camera', icon: Camera, ready: true },
  { kind: 'link', label: 'Paste video link', hint: 'Direct-link ingestion is coming next', icon: Link2, ready: false },
  { kind: 'youtube', label: 'Import from YouTube', hint: 'YouTube ingestion is coming next', icon: MonitorPlay, ready: false },
  { kind: 'google_drive', label: 'Google Drive', hint: 'Connect to import from Drive', icon: FolderDown, ready: false },
  { kind: 'dropbox', label: 'Dropbox', hint: 'Connect to import from Dropbox', icon: CloudDownload, ready: false },
  { kind: 'zoom', label: 'Zoom', hint: 'Connect to import recordings', icon: Video, ready: false },
  { kind: 'riverside', label: 'Riverside', hint: 'Connect to import studio sessions', icon: Mic2, ready: false },
];

export default function SourceStep() {
  const router = useRouter();
  const source = useCreateFlowStore((s) => s.source);
  const setSource = useCreateFlowStore((s) => s.setSource);
  const [selected, setSelected] = useState<SourceKind | null>(source?.kind ?? null);
  const [title, setTitle] = useState(source?.title ?? '');
  const [fileName, setFileName] = useState<string | null>(source?.fileName ?? null);
  const [uri, setUri] = useState<string | null>(source?.uri ?? null);
  const [mimeType, setMimeType] = useState<string | null>(source?.mimeType ?? null);
  const [sizeBytes, setSizeBytes] = useState<number | null>(source?.sizeBytes ?? null);
  const [durationSec, setDurationSec] = useState<number | null>(source?.durationSec ?? null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickVideo = async (fromCamera: boolean) => {
    setError(null);
    setPermissionDenied(false);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied(true);
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const nextFileName = asset.fileName ?? `video-${Date.now()}.mp4`;
      setFileName(nextFileName);
      setUri(asset.uri);
      setMimeType(asset.mimeType ?? 'video/mp4');
      setSizeBytes(asset.fileSize ?? null);
      setDurationSec(asset.duration ? Math.max(1, Math.round(asset.duration / 1000)) : null);
      if (!title) setTitle(nextFileName.replace(/\.[^.]+$/, ''));
      setSelected(fromCamera ? 'record' : 'upload');
    }
  };

  const choose = (opt: SourceOption) => {
    setError(null);
    if (!opt.ready) {
      setSelected(opt.kind);
      return;
    }
    if (opt.kind === 'upload') void pickVideo(false);
    else if (opt.kind === 'record') void pickVideo(true);
  };

  const selectedOption = OPTIONS.find((o) => o.kind === selected);
  const integrationPending = selectedOption ? !selectedOption.ready : false;
  const canContinue = Boolean(selected && !integrationPending && title.trim() && uri && fileName);

  const onNext = () => {
    if (!selected || !uri || !fileName) return;
    setSource({
      kind: selected,
      uri,
      fileName,
      mimeType: mimeType ?? 'video/mp4',
      sizeBytes: sizeBytes ?? undefined,
      durationSec: durationSec ?? undefined,
      title: title.trim(),
    });
    track('source_added', { kind: selected, sizeBytes: sizeBytes ?? undefined });
    router.push('/create/outcome');
  };

  return (
    <CreateStep
      step={1}
      title="Add your source video"
      subtitle="Long-form works best: podcasts, webinars, talks, interviews, streams."
      nextDisabled={!canContinue}
      onNext={onNext}
    >
      <View style={{ gap: spacing.md }}>
        {OPTIONS.map((opt) => (
          <Card
            key={opt.kind}
            onPress={() => choose(opt)}
            style={{
              borderColor: selected === opt.kind ? colors.primaryBorder : colors.border,
              backgroundColor: selected === opt.kind ? colors.primarySoft : colors.surface,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <opt.icon size={22} color={selected === opt.kind ? colors.primary : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{opt.label}</AppText>
                <AppText variant="caption" tone="muted">{opt.hint}</AppText>
              </View>
              {!opt.ready ? <Badge label="Connect soon" tone="accent" /> : null}
            </View>
          </Card>
        ))}

        {permissionDenied ? (
          <PermissionDeniedState
            title="Media access needed"
            body="Allow media library or camera access in Settings so we can import your video."
          />
        ) : null}

        {integrationPending && selectedOption ? (
          <Card>
            <AppText variant="bodyBold" tone="accent">{selectedOption.label} integration is on the roadmap</AppText>
            <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
              This connector is not live yet. Use device upload or recording for the production MVP.
            </AppText>
          </Card>
        ) : null}

        {fileName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <FileVideo size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="success">{fileName}</AppText>
              {sizeBytes ? (
                <AppText variant="caption" tone="muted">{(sizeBytes / 1024 / 1024).toFixed(1)} MB</AppText>
              ) : null}
            </View>
          </View>
        ) : null}

        {selected && !integrationPending ? (
          <Input
            label="Project title"
            placeholder="e.g. Podcast Ep. 43 — Hiring Lessons"
            value={title}
            onChangeText={setTitle}
            error={error ?? undefined}
          />
        ) : null}
      </View>
    </CreateStep>
  );
}
