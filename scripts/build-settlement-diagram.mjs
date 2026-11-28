import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const reference=JSON.parse(readFileSync(new URL('raw-data/settlement-reference.json',root),'utf8'));
const size=1218,center=size/2;
const screen=(x,z)=>[center+x,center-z];
const polygon=plot=>{
  const [x0,z0,x1,z1]=reference.footprintRect,angle=plot.yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return [[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>screen(plot.x+x*c+z*s,plot.z-x*s+z*c).map(v=>v.toFixed(2)).join(',')).join(' ');
};
// Original coordinate diagram. No competitor SVG, terrain mesh, imagery or code.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><title>ROB RUN settlement layout A: candidate plot footprints</title><desc>An independent coordinate diagram. North is up. Roads, terrain and live ownership are not depicted.</desc><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#a18e65" stroke-opacity=".16"/></pattern></defs><rect width="${size}" height="${size}" fill="#302c22"/><rect width="${size}" height="${size}" fill="url(#grid)"/><rect x="24" y="24" width="1170" height="1170" rx="4" fill="none" stroke="#b1a581" stroke-width="2" stroke-dasharray="10 8"/><g fill="#5a6045" stroke="#c5cd9d" stroke-width="2">${reference.plots.map(plot=>`<polygon points="${polygon(plot)}"/>`).join('')}</g><g fill="#edf1d8" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="central">${reference.plots.map(plot=>{const [x,y]=screen(plot.x,plot.z);return `<text x="${x}" y="${y}">${plot.number}</text>`;}).join('')}</g><g fill="#d5f839" font-family="sans-serif" font-size="18"><text x="1180" y="80" text-anchor="middle">N</text><path d="M1180 88v48m0-48-7 13m7-13 7 13" stroke="#d5f839" fill="none" stroke-width="3"/></g><g fill="#c8c4b4" font-family="sans-serif" font-size="13"><text x="48" y="65">LAYOUT A · COORDINATE DIAGRAM</text><text x="48" y="90">31 candidate footprints · not live ownership</text><path d="M68 1130h100m-100-6v12m100-12v12" fill="none" stroke="#d5f839" stroke-width="3"/><text x="118" y="1162" text-anchor="middle">100 game metres</text></g></svg>`;
writeFileSync(new URL('assets/maps/settlements.svg',root),svg+'\n');
const metadataUrl=new URL('assets/maps/sources.json',root),metadata=JSON.parse(readFileSync(metadataUrl,'utf8'));
const entry={file:'settlements.svg',source:reference.source,width:size,height:size,bytes:Buffer.byteLength(svg+'\n'),sha256:createHash('sha256').update(svg+'\n').digest('hex'),method:'Independently drawn plot footprints from numeric game-coordinate references. No competitor graphics, terrain or code copied.'};
metadata.images=[...metadata.images.filter(image=>image.file!=='settlements.svg'),entry];
writeFileSync(metadataUrl,JSON.stringify(metadata,null,2)+'\n');
console.log('Built independent settlement coordinate diagram: 31 plot footprints.');
