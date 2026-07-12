import React from 'react';
import { View } from 'react-native';
import { CloudOff, Inbox, Lock, ShieldAlert, TriangleAlert } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/theme/tokens';

interface StateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

function StateBlock({ title, body, actionLabel, onAction, icon }: StateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.x4l, paddingHorizontal: spacing.xxl, gap: spacing.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.xl,
          backgroundColor: colors.surfaceHigh,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {icon}
      </View>
      <AppText variant="h3" center>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" tone="secondary" center>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}

export function EmptyState(props: StateProps) {
  return <StateBlock icon={<Inbox size={28} color={colors.textMuted} />} {...props} />;
}

export function ErrorState(props: StateProps) {
  return <StateBlock icon={<TriangleAlert size={28} color={colors.danger} />} {...props} />;
}

export function OfflineState(props: Partial<StateProps>) {
  return (
    <StateBlock
      icon={<CloudOff size={28} color={colors.warning} />}
      title={props.title ?? 'You’re offline'}
      body={props.body ?? 'Reconnect to sync projects and continue processing.'}
      actionLabel={props.actionLabel}
      onAction={props.onAction}
    />
  );
}

export function PermissionDeniedState(props: Partial<StateProps>) {
  return (
    <StateBlock
      icon={<ShieldAlert size={28} color={colors.warning} />}
      title={props.title ?? 'Permission needed'}
      body={props.body ?? 'Enable access in your device settings to continue.'}
      actionLabel={props.actionLabel}
      onAction={props.onAction}
    />
  );
}

export function RestrictedState(props: Partial<StateProps> & { onUpgrade?: () => void }) {
  return (
    <StateBlock
      icon={<Lock size={28} color={colors.accent} />}
      title={props.title ?? 'Upgrade to unlock'}
      body={props.body ?? 'This feature is part of a higher plan.'}
      actionLabel={props.actionLabel ?? 'View plans'}
      onAction={props.onUpgrade ?? props.onAction}
    />
  );
}
