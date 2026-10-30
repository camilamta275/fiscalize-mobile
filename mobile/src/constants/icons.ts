import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

/**
 * Every icon the app uses, paired per platform (SF Symbols on iOS, Material
 * Symbols on Android/web). Centralising the mapping keeps the screens free of
 * platform checks and makes it obvious which symbols are in use.
 */
// Created by AI.
export type IconName = Exclude<NonNullable<ComponentProps<typeof SymbolView>['name']>, string>;

// Created by AI.
// Updated by AI.
export const Icons = {
  arrowLeft: { android: 'arrow_back', ios: 'arrow.left', web: 'arrow_back' },
  arrowRight: { android: 'arrow_forward', ios: 'arrow.right', web: 'arrow_forward' },
  bell: { android: 'notifications', ios: 'bell.fill', web: 'notifications' },
  building: { android: 'apartment', ios: 'building.2.fill', web: 'apartment' },
  calendar: { android: 'calendar_today', ios: 'calendar', web: 'calendar_today' },
  camera: { android: 'photo_camera', ios: 'camera.fill', web: 'photo_camera' },
  check: { android: 'check', ios: 'checkmark', web: 'check' },
  checkCircle: { android: 'check_circle', ios: 'checkmark.circle.fill', web: 'check_circle' },
  chevronDown: { android: 'expand_more', ios: 'chevron.down', web: 'expand_more' },
  chevronRight: { android: 'chevron_right', ios: 'chevron.right', web: 'chevron_right' },
  clock: { android: 'schedule', ios: 'clock.fill', web: 'schedule' },
  close: { android: 'close', ios: 'xmark', web: 'close' },
  document: { android: 'description', ios: 'doc.text.fill', web: 'description' },
  edit: { android: 'edit', ios: 'pencil', web: 'edit' },
  eye: { android: 'visibility', ios: 'eye.fill', web: 'visibility' },
  filter: { android: 'tune', ios: 'slider.horizontal.3', web: 'tune' },
  image: { android: 'image', ios: 'photo.fill', web: 'image' },
  info: { android: 'info', ios: 'info.circle.fill', web: 'info' },
  lock: { android: 'lock', ios: 'lock.fill', web: 'lock' },
  logOut: {
    android: 'logout',
    ios: 'rectangle.portrait.and.arrow.right',
    web: 'logout',
  },
  mail: { android: 'mail', ios: 'envelope.fill', web: 'mail' },
  mapPin: { android: 'location_on', ios: 'mappin.and.ellipse', web: 'location_on' },
  message: { android: 'chat_bubble', ios: 'text.bubble.fill', web: 'chat_bubble' },
  person: { android: 'person', ios: 'person.fill', web: 'person' },
  phone: { android: 'call', ios: 'phone.fill', web: 'call' },
  plus: { android: 'add', ios: 'plus', web: 'add' },
  refresh: { android: 'refresh', ios: 'arrow.clockwise', web: 'refresh' },
  search: { android: 'search', ios: 'magnifyingglass', web: 'search' },
  send: { android: 'send', ios: 'paperplane.fill', web: 'send' },
  shield: { android: 'shield', ios: 'shield.fill', web: 'shield' },
  trash: { android: 'delete', ios: 'trash.fill', web: 'delete' },
  users: { android: 'group', ios: 'person.2.fill', web: 'group' },
  warning: { android: 'warning', ios: 'exclamationmark.triangle.fill', web: 'warning' },
} satisfies Record<string, IconName>;
