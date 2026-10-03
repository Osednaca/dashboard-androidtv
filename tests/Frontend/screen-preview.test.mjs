import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as icons from 'lucide-react';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '../../resources/js');
const modules = new Map();
function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const source = readFileSync(file, 'utf8');
    const module = { exports: {} };
    modules.set(file, module);
    const { outputText } = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } });
    const localRequire = name => {
        if (name === 'lucide-react') return icons;
        if (name.startsWith('@/') || name.startsWith('.')) {
            const base = name.startsWith('@/') ? resolve(root, name.slice(2)) : resolve(dirname(file), name);
            for (const ext of ['.tsx', '.ts']) {
                try { return load(base + ext); } catch (error) { if (error.code !== 'ENOENT') throw error; }
            }
        }
        return require(name);
    };
    new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
    return module.exports;
}
const { ScreenPreview } = load(resolve(root, 'Components/app/ScreenPreview.tsx'));
const image = { id: 1, type: 'image', url: '/confirmed.jpg' };
const video = { id: 2, type: 'video', url: '/confirmed.mp4' };
const preview = {
    device: { id: 1, name: 'TV', is_online: true, business: { name: 'Negocio' }, location: null },
    layout: { name: 'Confirmado', rotation: 90, split: 'top_bottom', business_first: false,
        business_percentage: 70, advertising_percentage: 30, ratio: '70/30' },
    business_media: video, advertising: { campaign_name: 'Pauta', media: image },
    playlist: null, manifest_version: '100', pending_manifest_version: '200', status: 'approximate',
    last_sync_at: null, checked_at: null,
};
const render = data => renderToStaticMarkup(React.createElement(ScreenPreview, { preview: data }));

test('portrait preview has upright aspect, top/bottom split, configured zone order and video', () => {
    const html = render(preview);
    assert.match(html, /aspect-ratio:9 \/ 16/);
    assert.match(html, /Vertical · 90°/);
    assert.match(html, /Arriba \/ abajo/);
    assert.ok(html.indexOf('data-preview-zone="advertising"') < html.indexOf('data-preview-zone="business"'));
    assert.match(html, /<video[^>]*src="\/confirmed.mp4"/);
    assert.match(html, /<img[^>]*src="\/confirmed.jpg"/);
    assert.match(html, /no está sincronizada/);
    assert.match(html, /cambios pendientes de confirmar/);
});

test('explicit zero and 180 remain horizontal while 270 is vertical', () => {
    for (const rotation of [0, 90, 180, 270]) {
        const html = render({ ...preview, layout: { ...preview.layout, rotation, split: 'side_by_side', business_first: true } });
        assert.match(html, new RegExp(`>${rotation % 180 ? 'Vertical' : 'Horizontal'} · ${rotation}°<`));
        assert.match(html, /Izquierda \/ derecha/);
        assert.match(html, rotation % 180 ? /aspect-ratio:9 \/ 16/ : /aspect-ratio:16 \/ 9/);
        assert.ok(html.indexOf('data-preview-zone="business"') < html.indexOf('data-preview-zone="advertising"'));
    }
});

test('unconfirmed content is visibly unavailable and does not claim playback', () => {
    const html = render({ ...preview, layout: null, status: 'unconfirmed', business_media: null, advertising: null });
    assert.match(html, /Orientación sin confirmar/);
    assert.match(html, /todavía no ha confirmado un manifiesto/);
    assert.doesNotMatch(html, /<video|<img|Reproduciendo/);
});

test('live sources use the embedded player rather than an image URL', () => {
    const live = { id: 3, type: 'live_stream', url: 'https://www.youtube.com/watch?v=abcdefghijk',
        live: { provider: 'youtube', original_url: 'https://www.youtube.com/watch?v=abcdefghijk', source_id: 'abcdefghijk', embed_url: '/live/embed/3?signature=test' } };
    const html = render({ ...preview, business_media: null, advertising: { campaign_name: 'Directo', media: live } });
    assert.match(html, /<iframe[^>]*src="\/live\/embed\/3\?signature=test"/);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /Vista aproximada/);
});
