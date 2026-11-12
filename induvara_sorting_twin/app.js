import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
// Wait for the UI font so 3D canvas labels are drawn with it, not a fallback.
try{await Promise.race([Promise.all(['600 65px "IBM Plex Sans Thai"','700 65px "IBM Plex Sans Thai"','500 65px "IBM Plex Mono"'].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
const $=id=>document.getElementById(id),vp=$('viewport');
const beltTopY=1.22+.12/2, partBevel=.015, partDepth=.30;
const partRestY=beltTopY+partBevel, pusherAxisY=partRestY+partDepth/2;
const scene=new T.Scene();scene.background=new T.Color('#e6ebe8');scene.fog=new T.Fog('#e6ebe8',38,95);
// Logical machine coordinates are reflected so front-view left/right match the reference photo.
const machine=new T.Group();machine.scale.x=-1;scene.add(machine);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;vp.appendChild(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
const camera=new T.PerspectiveCamera(36,1,.1,150);const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.48;orbit.minDistance=6;orbit.maxDistance=42;orbit.target.set(-2.4,1,.9);camera.position.set(-13,15.2,-13.3);
scene.add(new T.HemisphereLight(0xffffff,0x7d8b81,2));const key=new T.DirectionalLight(0xfff4e2,4);key.position.set(-8,20,-8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-20,right:20,top:16,bottom:-16});key.shadow.bias=-.0004;scene.add(key);
const mat=(color,metalness=0,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
const alu=mat('#b9c2c5',.85,.28),steel=mat('#c8d0d2',.95,.18),brushed=mat('#aeb7b9',.85,.38),dark=mat('#252d30',.35,.4),rubber=mat('#181e1c',.05,.7),blue=mat('#0699db',.1,.35),grey=mat('#899191',.25,.5),white=mat('#ecece4',.15,.4),black=mat('#171b1c',.1,.45),red=mat('#aa2024',.2,.3),green=mat('#07834c',.15,.25),yellow=mat('#e7b31b',.05,.32),beltmat=mat('#244c43',.05,.82),beige=mat('#b7b5a5',.35,.46);
const trans=new T.MeshPhysicalMaterial({color:'#d9e7e6',transparent:true,opacity:.36,metalness:.1,roughness:.12});
function box(w,h,d,m,x,y,z,parent=machine){let o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cyl(r,h,m,x,y,z,axis='y',parent=machine,r2=r){let o=new T.Mesh(new T.CylinderGeometry(r,r2,h,40),m);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function tube(points,m=blue,r=.035,parent=machine){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');const o=new T.Mesh(new T.TubeGeometry(path,Math.max(64,Math.ceil(path.getLength()*48)),r,12,false),m);parent.add(o);o.castShadow=true;o.userData.path=path;return o;}
function text(s,w,h,x,y,z,parent=machine,rot=0,bg='#f1f1e9',fg='#263330'){let c=document.createElement('canvas');c.width=1024;c.height=256;let ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.font='600 65px "IBM Plex Sans Thai", Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,512,128,980);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;let mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.65}));mesh.position.set(x,y,z);mesh.rotation.x=rot;if(!Number(rot))mesh.rotation.y=Math.PI;mesh.scale.x=-1;parent.add(mesh);return mesh;}
function bolt(x,y,z,p=machine){cyl(.065,.04,steel,x,y,z,'y',p);cyl(.027,.042,dark,x,y+.015,z,'y',p);}
function railX(x,y,z,len,parent=machine){box(len,.26,.32,alu,x,y,z,parent);for(let k of [-1,1])box(len,.035,.012,dark,x,y+k*.075,z-.163,parent);box(len,.035,.012,dark,x,y+.132,z,parent);}
function railZ(x,y,z,len,parent=machine){box(.32,.26,len,alu,x,y,z,parent);box(.035,.012,len,dark,x,y+.134,z,parent);}
// Aluminium slotted base, corner caps and carry handles.
for(let z=-3.65;z<=3.7;z+=.38){box(11.8,.19,.355,alu,0,.45,z);box(11.65,.014,.025,dark,0,.551,z);}
for(const z of [-3.95,3.95])railX(0,.62,z,12.25);for(const x of [-6,6]){railZ(x,.62,0,8.15);for(const z of [-4,4])box(.33,.28,.12,blue,x,.63,z);}
for(const x of [-5.5,5.5])for(const z of [-3.5,3.5]){cyl(.24,.33,rubber,x,.16,z);bolt(x,.59,z);}
for(const x of [-6.15,6.15]){box(.14,.22,1.8,black,x,.91,0);for(const z of [-.88,.88])box(.25,.32,.16,dark,x,.8,z);}
// Belt frame and textured moving surface.
const bt=document.createElement('canvas');bt.width=256;bt.height=256;let ctx=bt.getContext('2d');ctx.fillStyle='#294b40';ctx.fillRect(0,0,256,256);
for(let i=0;i<2500;i++){ctx.fillStyle=i%2?'#35594b':'#223f36';ctx.fillRect(Math.random()*256,Math.random()*256,1,2);}
// Woven fabric ribs across the belt, plus one lighter splice line and scuffs per tile: they make the motion visible.
for(let x=0;x<256;x+=8){ctx.fillStyle='rgba(15,35,28,.35)';ctx.fillRect(x,0,2,256);}
ctx.fillStyle='rgba(120,160,140,.28)';ctx.fillRect(120,0,6,256);ctx.fillStyle='rgba(10,25,20,.45)';ctx.fillRect(126,0,3,256);
for(let k=0;k<5;k++){ctx.fillStyle='rgba(95,130,112,.22)';ctx.beginPath();ctx.ellipse(30+k*47,40+((k*83)%180),14,5,0,0,Math.PI*2);ctx.fill();}
const beltTexture=new T.CanvasTexture(bt);beltTexture.colorSpace=T.SRGBColorSpace;beltTexture.wrapS=beltTexture.wrapT=T.RepeatWrapping;beltTexture.repeat.set(10,2);beltTexture.anisotropy=8;beltmat.map=beltTexture;
// End pulleys get their own copy of the texture: they turn, the belt top scrolls.
const pulleyMat=beltmat.clone();pulleyMat.map=beltTexture.clone();pulleyMat.map.repeat.set(1,4);pulleyMat.map.needsUpdate=true;
const pulleys=[];
// Symmetric conveyor: both pulleys at ±5.92, so each roller's outer edge is flush with the frame's outer edge (6.16).
const BELT_HEAD=5.92;box(12.24,.3,1.35,brushed,0,1,-1.75);const belt=box(11.84,.12,1.14,beltmat,0,1.22,-1.75);for(const x of [-BELT_HEAD,BELT_HEAD])pulleys.push(cyl(.25,1.18,pulleyMat,x,1.04,-1.75,'z'));for(const z of [-2.4,-1.1]){railX(0,1.06,z,12.24);for(let x=-5.5;x<=5.5;x+=1)bolt(x,1.22,z);}for(const x of [-4.7,4.7]){box(.23,.6,1.6,alu,x,.81,-1.75);box(.65,.08,.3,steel,x,1.35,-2.42);for(let z of [-2.4,-1.1])bolt(x,1.4,z);}
// SPG-style geared conveyor motor (S6D06-24A + S6DA90B1 gearhead) on an L-bracket, with clamp coupling.
const motorSpin=new T.Group();
// Belt surface speed = part speed (v units/s, + = toward chute B / far end).
function beltMove(v,dt){beltSurfaceV=v;if(v)beltLastT=performance.now();if(!v)return;beltTexture.offset.x-=v*dt*10/11.84;for(const p of pulleys)p.rotation.y-=v*dt/.25;motorSpin.rotation.z-=v*dt*3.4;/* same sense as the pulleys (both spin about +z) */}
{const M=new T.Group();M.position.set(-4.8,1.12,0);machine.add(M);
 const navy=new T.MeshPhysicalMaterial({color:'#161a2a',metalness:.12,roughness:.62,clearcoat:.12,clearcoatRoughness:.6});
 const navyDark=mat('#11131c',.12,.6),castAlu=mat('#c3c8c9',.7,.42),blackOx=mat('#101214',.5,.35);
 // Printed sticker texture helper (sRGB, crisp).
 const sticker=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;};
 const font=(g,wt,px)=>g.font=wt+' '+px+'px "IBM Plex Sans Thai", Arial';
 // L-bracket: slotted base on the frame plus an upright plate the gearhead bolts to.
 box(1.22,.06,.78,steel,0,-.5,-.36,M);box(1.02,1.0,.06,steel,0,-.02,-.47,M);
 for(const x of [-.4,.4]){box(.09,.008,.32,blackOx,x,-.466,-.42,M);bolt(-4.8+x,.66,-.42);}
 for(const x of [-.47,.47])box(.05,.42,.42,steel,x,-.27,-.24,M); // gussets
 // Square gearhead with flanges and corner screws.
 box(.94,.94,.74,navy,0,0,-.06,M);
 for(const z of [-.44,.33])box(.98,.98,.05,navyDark,0,0,z,M);
 for(const sx of [-.39,.39])for(const sy of [-.39,.39]){cyl(.036,.03,blackOx,sx,sy,-.478,'z',M);cyl(.036,.03,blackOx,sx,sy,.368,'z',M);}
 const gearTag=sticker(512,400,(g,w,h)=>{g.fillStyle='#1e2130';g.fillRect(0,0,w,h);g.textAlign='center';g.fillStyle='#f3f3f6';font(g,700,66);g.fillText('S6DA90B1',w/2,92);g.fillStyle='#a9557f';g.fillRect(0,140,w,104);g.fillStyle='#fff';font(g,700,78);g.fillText('SPG',w/2,220);g.fillStyle='#dfe1ea';font(g,500,30);g.fillText('SPG CO.,LTD',w/2,300);g.fillText('MADE IN KOREA',w/2,346);g.strokeStyle='#8a90ad';g.lineWidth=4;g.strokeRect(6,6,w-12,h-12);});
 for(const [y,rx] of [[.472,-Math.PI/2]]){const m=new T.Mesh(new T.PlaneGeometry(.56,.44),new T.MeshStandardMaterial({map:gearTag,roughness:.35}));m.rotation.x=rx;m.scale.x=-1;m.position.set(0,y,-.06);M.add(m);}
 {const m=new T.Mesh(new T.PlaneGeometry(.56,.44),new T.MeshStandardMaterial({map:gearTag,roughness:.35}));m.rotation.y=Math.PI/2;m.scale.x=-1;m.position.set(.472,0,-.06);M.add(m);}
 // Motor body: dark navy can, front ring, two through-bolts.
 cyl(.45,.08,navyDark,0,0,.42,'z',M);
 cyl(.42,.98,navy,0,0,.95,'z',M);
 for(const a of [Math.PI*.25,Math.PI*1.25])cyl(.016,1.3,steel,Math.cos(a)*.43,Math.sin(a)*.43,1.0,'z',M);
 // Wrap-around rating sticker on the motor can (open cylinder segment).
 const motorTag=sticker(1024,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#e4e6ea');gr.addColorStop(.5,'#c9ccd3');gr.addColorStop(1,'#dfe1e5');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#262a40';font(g,700,74);g.textAlign='left';g.fillText('S6D06-24A',40,100);g.fillStyle='#a9557f';g.fillRect(0,140,w,96);g.fillStyle='#fff';font(g,700,70);g.fillText('SPG',40,214);font(g,500,34);g.fillText('INDUCTION MOTOR',220,206);g.fillStyle='#2f3348';font(g,500,34);['DC 24V   6W   0.5A','1800 r/min   CONT.   INS. E'].forEach((s,k)=>g.fillText(s,40,300+k*50));font(g,500,28);g.fillText('SPG CO.,LTD   MADE IN KOREA',40,470);});
 motorTag.wrapS=T.RepeatWrapping;motorTag.repeat.x=-1;
 {const m=new T.Mesh(new T.CylinderGeometry(.424,.424,.42,48,1,true,-Math.PI*.24,Math.PI*.48),new T.MeshStandardMaterial({map:motorTag,roughness:.3,metalness:.35,side:T.DoubleSide}));m.rotation.x=Math.PI/2;m.rotation.y=Math.PI;m.position.set(0,0,.95);M.add(m);}
 // Ribbed cast-aluminium end bell and rear cap.
 cyl(.43,.32,castAlu,0,0,1.6,'z',M);
 for(let a=0;a<28;a++){const an=a*Math.PI*2/28;const r=box(.035,.06,.3,castAlu,Math.cos(an)*.44,Math.sin(an)*.44,1.6,M);r.rotation.z=an;}
 cyl(.36,.05,mat('#9aa1a3',.75,.35),0,0,1.78,'z',M);cyl(.12,.05,castAlu,0,0,1.81,'z',M);
 for(let a=0;a<4;a++){const an=a*Math.PI/2+Math.PI/4;cyl(.025,.03,blackOx,Math.cos(an)*.27,Math.sin(an)*.27,1.81,'z',M);}
 // Cable gland and red/black leads dropping to the frame.
 cyl(.06,.12,blackOx,0,.45,1.45,'y',M);
 tube([[-4.83,1.62,1.45],[-4.83,1.78,1.52],[-4.83,1.7,1.85],[-4.85,.85,2.05]],red,.022);
 tube([[-4.77,1.62,1.45],[-4.77,1.8,1.55],[-4.77,1.72,1.88],[-4.75,.85,2.08]],black,.022);
 // Output shaft and slotted aluminium clamp coupling (spins with the belt).
 motorSpin.position.set(0,0,-.5);M.add(motorSpin);
 cyl(.075,.42,steel,0,0,-.2,'z',motorSpin);box(.04,.02,.3,dark,0,.07,-.2,motorSpin);
 cyl(.19,.40,castAlu,0,0,-.42,'z',motorSpin);
 for(const z of [-.34,-.42,-.50])cyl(.193,.012,blackOx,0,0,z,'z',motorSpin);
 for(const z of [-.27,-.57]){cyl(.193,.01,blackOx,0,0,z+.03,'z',motorSpin);const s=cyl(.028,.07,blackOx,.12,.14,z,'x',motorSpin);s.rotation.z=Math.PI/2;}
 cyl(.075,.2,steel,0,0,-.66,'z',motorSpin);
}
// Receiving chutes open upward, declining toward front.
const chuteAngle=-.24, chuteCenterY=1.0, chuteCenterZ=-3.2;
function chute(x,label){const g=new T.Group();machine.add(g);g.position.set(x,chuteCenterY,chuteCenterZ);g.rotation.x=chuteAngle;box(1.04,.045,2.35,steel,0,0,-.375,g);// Stop side walls outside the belt edge (world Z = -2.32), including their tilted top corners.
for(const dx of [-.53,.53])box(.045,.22,2.41,brushed,dx,.09,-.405,g);// End stop shares the chute rotation, so its face is perpendicular to the sloped bed.
box(1.105,.2225,.06,brushed,0,.08875,-1.58,g);box(1.1,.05,.15,alu,0,-.1,.70,g);return g;}chute(-2.1,'CHUTE A');chute(3,'CHUTE B');
// Pneumatic cylinders: barrel, tie rods, caps, fittings, reed switches.
const actuators=[];
// SMC CDM2-style round air cylinder: polished stainless barrel with printed label, round aluminium
// end caps with ports, threaded rear boss, threaded nose through a bracket with hex mounting nut,
// band-mounted reed switch. Axis = z, rod exits toward -z, centre height y=.7 in the actuator group.
const cylSS=new T.MeshPhysicalMaterial({color:'#dfe3e6',metalness:1,roughness:.13,clearcoat:.4,clearcoatRoughness:.15});
const cylCap=mat('#cdd1d4',.55,.42),cylSeam=mat('#5c6266',.4,.5),cylNut=mat('#b7bcc0',.9,.3),cylPortHole=mat('#2a2e31',.2,.6);
let cylLabelMat=null;
function cylLabel(){if(cylLabelMat)return cylLabelMat;const c=document.createElement('canvas');c.width=1024;c.height=320;const g=c.getContext('2d');
 g.fillStyle='#f4f4f1';g.fillRect(0,0,1024,320);g.fillStyle='#24272b';g.textBaseline='middle';
 g.font='600 46px "IBM Plex Sans Thai", Arial';g.fillText('CDM2B25-75Z',40,70);g.font='500 34px "IBM Plex Sans Thai", Arial';g.fillText('MAX 1.0MPa',40,150);
 g.font='800 64px Arial';g.fillText('SMC',40,240);g.font='500 34px "IBM Plex Sans Thai", Arial';g.fillText('CHINA',520,150);
 g.strokeStyle='#24272b';g.lineWidth=4;g.strokeRect(760,40,220,64);g.font='600 38px "IBM Plex Mono", monospace';g.fillText('ZE1-58U',778,74);
 g.strokeRect(800,130,56,56);g.strokeRect(880,130,64,56);g.font='700 34px Arial';g.fillText('G',815,160);g.fillText('UL',890,160);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.wrapS=T.RepeatWrapping;t.repeat.x=-1;
 return cylLabelMat=new T.MeshStandardMaterial({map:t,roughness:.45,side:T.DoubleSide});}
const CYL_FRONT=-.66,CYL_REAR=.92;
const reedLEDs=[]; // per actuator, in creation order (A, B, feed) = actuators[] order
function cylinderBody(g){
 const R=.19,CR=.235,mid=(CYL_FRONT+CYL_REAR)/2,len=CYL_REAR-CYL_FRONT-.2;
 cyl(R,len,cylSS,0,.7,mid,'z',g);                                              // stainless barrel
 const lbl=new T.Mesh(new T.CylinderGeometry(R+.003,R+.003,.7,48,1,true,-Math.PI*.3,Math.PI*.6),cylLabel());lbl.rotation.x=Math.PI/2;lbl.rotation.y=Math.PI;lbl.position.set(0,.7,mid+.05);g.add(lbl);
 for(const zz of [CYL_FRONT,CYL_REAR]){const out=zz<0?-1:1;
  cyl(CR,.2,cylCap,0,.7,zz,'z',g);                                             // round end cap
  cyl(R+.008,.025,cylSeam,0,.7,zz-out*.112,'z',g);                             // seam/gasket ring
  cyl(CR+.005,.018,cylCap,0,.7,zz+out*.095,'z',g);                             // chamfer lip
  cyl(.05,.02,cylPortHole,0,.7+CR,zz,'y',g);                                   // port (top)
  cyl(.045,.15,mat('#c9ccce',.9,.22),0,.7+CR+.07,zz,'y',g);                    // fitting stem
  cyl(.1,.14,white,0,1.14,zz,'y',g);cyl(.08,.2,white,.11,1.17,zz,'x',g);        // push-in elbow fitting
  cyl(.038,.02,cylPortHole,CR,.78,zz,'x',g);                                   // side port plug
 }
 // Threaded rear boss.
 cyl(.165,.18,cylCap,0,.7,CYL_REAR+.19,'z',g);for(let k=0;k<5;k++){const r=new T.Mesh(new T.TorusGeometry(.168,.008,6,40),cylCap);r.position.set(0,.7,CYL_REAR+.12+k*.034);g.add(r);}
 // Rear saddle, front bracket plate, threaded nose and hex mounting nut.
 box(.34,.32,.2,brushed,0,.3,CYL_REAR,g);
 box(.56,.86,.05,brushed,0,.57,-.9,g);for(const xx of [-.2,.2])bolt(xx,.16,-.9,g);
 cyl(.12,.24,cylNut,0,.7,-.9,'z',g);for(let k=0;k<6;k++){const r=new T.Mesh(new T.TorusGeometry(.123,.007,6,32),cylNut);r.position.set(0,.7,-.82-k*.033);g.add(r);}
 const nut=new T.Mesh(new T.CylinderGeometry(.18,.18,.08,6),cylNut);nut.rotation.x=Math.PI/2;nut.rotation.y=Math.PI/6;nut.position.set(0,.7,-.97);nut.castShadow=true;g.add(nut);
 cyl(.07,.04,cylSeam,0,.7,-1.03,'z',g);                                        // rod seal
 // Two reed switches on band clamps: rear one detects "retracted", front one "extended". Their LEDs
 // follow the real piston position (see reedTick). Cables run back along the barrel.
 const leds={};
 for(const [key,zz] of [['ret',CYL_REAR-.2],['ext',CYL_FRONT+.2]]){
  const band=new T.Mesh(new T.TorusGeometry(R+.008,.012,6,48),cylSeam);band.position.set(0,.7,zz);g.add(band);
  const sw=new T.Group();sw.position.set(0,.7,zz);sw.rotation.z=Math.PI*.22;g.add(sw);
  box(.065,.06,.3,mat('#1d2023',.2,.5),0,R+.03,0,sw);
  const led=new T.MeshStandardMaterial({color:'#4a1212',emissive:new T.Color('#ff1a0a'),emissiveIntensity:0,roughness:.3});box(.032,.02,.05,led,0,R+.065,-.1,sw);leds[key]=led;
  const cx=-Math.sin(Math.PI*.22)*(R+.03),cy=.7+Math.cos(Math.PI*.22)*(R+.03);
  tube([[cx,cy,zz+.15],[cx-.02,cy+.02,zz+.3],[cx-.01,cy+.05,CYL_REAR+.1]],mat('#2b2f33',.1,.6),.014,g);
 }
 reedLEDs.push(leds);
}
function actuator(x,z,feed=false){const g=new T.Group();machine.add(g);g.position.set(x,pusherAxisY-.7,z);/* Support and head follow the resting workpiece center. */const supportHeight=pusherAxisY-.7-.02-.56;box(1.05,supportHeight,2.15,brushed,x,.56+supportHeight/2,z);box(1.05,.16,2.15,brushed,0,.06,0,g);for(const xx of [-.43,.43])for(const zz of [-.8,.8])bolt(xx,.16,zz,g);cylinderBody(g);let moving=new T.Group();g.add(moving);// Rubber pusher tip: polished rod, hex locknut, tapered shoulder and flat contact face.
// Rod runs back inside the barrel so it stays visible over the full 1.15 stroke.
cyl(.055,2.1,steel,0,.7,-.18,'z',moving);
const locknut=new T.Mesh(new T.CylinderGeometry(.085,.085,.065,6),steel);
locknut.rotation.x=Math.PI/2;locknut.position.set(0,.7,-1.1775);locknut.castShadow=true;moving.add(locknut);
cyl(.085,.075,rubber,0,.7,-1.2475,'z',moving,.145);
cyl(.145,.18,rubber,0,.7,-1.375,'z',moving);
actuators.push(moving);return moving;}
// Contact kinematics: a part only moves while the rubber face touches its back edge.
const TIP=1.465, PART_R=.36+.018, SORT_Z=.43, SORT_STROKE=1.15, FEED_Z=1.70;
const FEED_REST_FACE=FEED_Z-TIP, FEED_STROKE=FEED_REST_FACE-(-1.75+PART_R);
const sortFace=e=>SORT_Z-TIP-e*SORT_STROKE;                 // world z of a sort pusher's rubber face
const feedPartZ=f=>Math.min(-.15,FEED_REST_FACE-f*FEED_STROKE-PART_R);
const chuteEntryZ=chuteCenterZ+.8*Math.cos(chuteAngle);
function chuteStopZ(slotZ){return chuteCenterZ+slotZ*Math.cos(chuteAngle)+(.045/2+partBevel)*Math.sin(chuteAngle);}
function posePart(mesh,z){mesh.position.z=z;const onChute=z<=chuteEntryZ;const surfaceY=chuteCenterY-Math.tan(chuteAngle)*(z-chuteCenterZ)+(.045/2+partBevel)/Math.cos(chuteAngle);
 mesh.position.y=onChute?surfaceY:T.MathUtils.lerp(partRestY,chuteCenterY-.8*Math.sin(chuteAngle)+(.045/2+partBevel)/Math.cos(chuteAngle),Math.max(0,(-1.75-z)/(-1.75-chuteEntryZ)));mesh.rotation.x=-Math.PI/2+(onChute?chuteAngle:0);}
// Pushed part: follows the face while on the belt edge, then slides down the chute on its own.
function pushPart(zp,e,stopZ,dt){if(zp>chuteEntryZ)return Math.min(zp,sortFace(e)-PART_R);return Math.max(stopZ,zp-dt*5.5);}
actuator(-2.1,SORT_Z);actuator(3,SORT_Z);actuator(0,FEED_Z,true);
// ---------- Rigid-body physics for parts leaving the belt (virtual-commissioning style) ----------
// Each part is a solid disc (mass 1, disc inertia). Contacts are sampled on both rims against the
// machine's collision shapes: moving belt (surface speed drives the part), head/tail pulleys (round),
// station base, frame rails, handles and the floor. Impulses give restitution, Coulomb friction and spin.
// Resting parts become obstacles, so later parts land on top of them.
const PHYS_G=45,PHYS_E=.38,PHYS_MU=.3,PHYS_R=.36+.018,PHYS_COM=.15,PHYS_HALF=.165,PHYS_SUB=8;
const IBODY=new T.Vector3(1/((3*PHYS_R*PHYS_R+.33*.33)/12),1/(PHYS_R*PHYS_R/2),1/((3*PHYS_R*PHYS_R+.33*.33)/12)); // inverse inertia, body axes (y = disc axis)
const physBoxes=[ // [x0,x1,z0,z1,top, isBelt]
 [-5.92,5.92,-2.32,-1.18,1.28,true],     // belt carrying surface
 [-6.12,6.12,-2.425,-1.075,1.15,false],  // belt frame under the belt
 [-5.9,5.9,-3.8,3.8,.545,false],         // slotted base plate
 [5.84,6.16,-4.075,4.075,.75,false],[-6.16,-5.84,-4.075,4.075,.75,false], // side frame rails
 [-6.25,6.25,3.79,4.11,.75,false],[-6.25,6.25,-4.11,-3.79,.75,false],     // front/back frame rails
 [6.08,6.22,-.9,.9,1.02,false],[-6.22,-6.08,-.9,.9,1.02,false]];          // carry handles
const PULLEYS=[[5.92,1.04],[-5.92,1.04]],PULLEY_R=.24,PULLEY_Z=[-2.34,-1.16],FLOOR_Y=-.07;
const bodies=[],restingParts=[];let beltSurfaceV=0;
const _q=new T.Quaternion(),_m=new T.Matrix3(),_mt=new T.Matrix3(),_v=new T.Vector3(),_r=new T.Vector3(),_t=new T.Vector3(),_n=new T.Vector3();
const meshFix=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
function startDrop(mesh,speed){ // mesh: a part lying flat on the belt (origin = bottom face centre)
 const q=new T.Quaternion();
 // Real parts are never perfectly symmetric: a small random wobble keeps the motion 3D (no coin-on-edge balance).
 const rnd=()=>Math.random()*2-1;
 bodies.push({mesh,c:mesh.position.clone().add(new T.Vector3(0,PHYS_COM,0)),v:new T.Vector3(speed,0,rnd()*.06),q,w:new T.Vector3(rnd()*.9,rnd()*.6,rnd()*.4),still:0});}
function invInertia(q){const m=new T.Matrix4().makeRotationFromQuaternion(q);_m.setFromMatrix4(m);_mt.copy(_m).transpose();
 const d=new T.Matrix3().set(IBODY.x,0,0,0,IBODY.y,0,0,0,IBODY.z);return new T.Matrix3().multiplyMatrices(_m,d).multiply(_mt);}
// Collision query for one world point: deepest contact (normal, depth, surface velocity) or null.
function contactAt(p){let best=null;const take=(nx,ny,nz,d,vs)=>{if(!best||d>best.d)best={n:new T.Vector3(nx,ny,nz),d,vs};};
 if(p.y<FLOOR_Y)take(0,1,0,FLOOR_Y-p.y,0);
 for(const [x0,x1,z0,z1,top,belt] of physBoxes){if(p.x<x0||p.x>x1||p.z<z0||p.z>z1||p.y>top||p.y<top-.6)continue;
  const up=top-p.y,sx0=p.x-x0,sx1=x1-p.x,sz0=p.z-z0,sz1=z1-p.z,m=Math.min(up,sx0,sx1,sz0,sz1);
  const vs=belt?beltSurfaceV:0;
  if(m===up)take(0,1,0,up,vs);else if(m===sx0)take(-1,0,0,sx0,0);else if(m===sx1)take(1,0,0,sx1,0);else if(m===sz0)take(0,0,-1,sz0,0);else take(0,0,1,sz1,0);}
 if(p.z>PULLEY_Z[0]&&p.z<PULLEY_Z[1])for(const [px,py] of PULLEYS){const dx=p.x-px,dy=p.y-py,dl=Math.hypot(dx,dy);if(dl<PULLEY_R&&dl>1e-6)take(dx/dl,dy/dl,0,PULLEY_R-dl,beltSurfaceV);}
 return best;}
const RIM=[];for(let k=0;k<20;k++){const a=k/20*Math.PI*2;for(const y of [-PHYS_HALF,PHYS_HALF])RIM.push(new T.Vector3(PHYS_R*Math.cos(a),y,PHYS_R*Math.sin(a)));}
const SHELL=[...RIM];for(const y of [-PHYS_HALF,PHYS_HALF]){SHELL.push(new T.Vector3(0,y,0));for(const r of [.13,.26])for(let k=0;k<8;k++){const a=(k+(r>.2?.5:0))/8*Math.PI*2;SHELL.push(new T.Vector3(r*Math.cos(a),y,r*Math.sin(a)));}}
for(let k=0;k<12;k++){const a=k/12*Math.PI*2;SHELL.push(new T.Vector3(PHYS_R*Math.cos(a),0,PHYS_R*Math.sin(a)));} // rim mid-line
function stepBody(b,h){
 b.v.y-=PHYS_G*h;b.c.addScaledVector(b.v,h);
 const wq=new T.Quaternion(b.w.x*h*.5,b.w.y*h*.5,b.w.z*h*.5,0).multiply(b.q);b.q.set(b.q.x+wq.x,b.q.y+wq.y,b.q.z+wq.z,b.q.w+wq.w).normalize();
 const I=invInertia(b.q),contacts=[];
 for(const lp of SHELL){const p=lp.clone().applyQuaternion(b.q).add(b.c),c=contactAt(p);if(c){c.p=p;contacts.push(c);}}
 // Box top edges poking into the disc (edge-to-face and edge-to-rim): push out along the shorter way.
 const qi=b.q.clone().invert(),reach=PHYS_R+.05;
 const probe=(px,py,pz,vs)=>{const L=_v.set(px-b.c.x,py-b.c.y,pz-b.c.z).applyQuaternion(qi);const rr=Math.hypot(L.x,L.z);
  if(Math.abs(L.y)>PHYS_HALF||rr>PHYS_R)return;const dF=PHYS_HALF-Math.abs(L.y),dR=PHYS_R-rr;
  const n=dF<dR?new T.Vector3(0,-Math.sign(L.y)||-1,0):new T.Vector3(-L.x/(rr||1),0,-L.z/(rr||1));n.applyQuaternion(b.q);
  contacts.push({p:new T.Vector3(px,py,pz),n,d:Math.min(dF,dR),vs});};
 for(const [x0,x1,z0,z1,top,belt] of physBoxes){if(Math.abs(b.c.y-top)>reach)continue;const vs=belt?beltSurfaceV:0;
  const ax=Math.max(x0,b.c.x-reach),bx=Math.min(x1,b.c.x+reach),az=Math.max(z0,b.c.z-reach),bz=Math.min(z1,b.c.z+reach);
  if(ax<=bx)for(let x=ax;x<=bx;x+=.035)for(const z of [z0,z1])if(Math.abs(z-b.c.z)<reach)probe(x,top,z,vs);
  if(az<=bz)for(let z=az;z<=bz;z+=.035)for(const x of [x0,x1])if(Math.abs(x-b.c.x)<reach)probe(x,top,z,vs);}
 // Disc against disc (moving or resting): points of this disc inside the other push this one out
 // along the other's nearest surface; points of the other inside this disc push this one away.
 for(const o of bodies){if(o===b||o.c.distanceToSquared(b.c)>(2*PHYS_R+.1)**2)continue;
  const oqi=o.q.clone().invert();
  for(const lp of SHELL){const P=lp.clone().applyQuaternion(b.q).add(b.c);const L=_v.copy(P).sub(o.c).applyQuaternion(oqi);const rr=Math.hypot(L.x,L.z);
   if(Math.abs(L.y)>=PHYS_HALF||rr>=PHYS_R)continue;const dF=PHYS_HALF-Math.abs(L.y),dR=PHYS_R-rr;
   const n=dF<dR?new T.Vector3(0,Math.sign(L.y)||1,0):new T.Vector3(L.x/(rr||1),0,L.z/(rr||1));n.applyQuaternion(o.q);
   contacts.push({p:P,n,d:Math.min(dF,dR),vs:0});}
  for(const lp of SHELL){const P=lp.clone().applyQuaternion(o.q).add(o.c);probe(P.x,P.y,P.z,0);}}
 // Projected Gauss-Seidel: accumulated, clamped normal impulses (restitution from the approach speed),
 // then Coulomb friction from the total normal impulse at the contact centroid (belt surface speed included).
 const acc=contacts.map(()=>0);let impactV=0;
 for(const c of contacts){_r.copy(c.p).sub(b.c);c.r=_r.clone();c.k=1+c.n.dot(_t.copy(c.r).cross(c.n).applyMatrix3(I).cross(c.r));
  const vn0=_v.copy(b.w).cross(c.r).add(b.v).dot(c.n);c.target=vn0<-1.0?-PHYS_E*vn0:0;if(-vn0>impactV)impactV=-vn0;}
 if(impactV>1.6&&performance.now()-(b.snd||0)>70){b.snd=performance.now();Sfx.impact(impactV);}
 const normalPass=()=>{for(let i=0;i<contacts.length;i++){const c=contacts[i];const vn=_v.copy(b.w).cross(c.r).add(b.v).dot(c.n);
  const j=(c.target-vn)/c.k,na=Math.max(0,acc[i]+j),d=na-acc[i];acc[i]=na;if(d){b.v.addScaledVector(c.n,d);b.w.add(_t.copy(c.r).cross(c.n).multiplyScalar(d).applyMatrix3(I));}}};
 for(let it=0;it<6;it++)normalPass();
 const J=acc.reduce((s,a)=>s+a,0);
 if(J>1e-6){const pc=new T.Vector3(),n=new T.Vector3();let vs=0,best=0;
  contacts.forEach((c,i)=>{pc.addScaledVector(c.p,acc[i]/J);n.addScaledVector(c.n,acc[i]/J);if(acc[i]>best){best=acc[i];vs=c.vs;}});n.normalize();
  const r=pc.sub(b.c),vp=_v.copy(b.w).cross(r).add(b.v);vp.x-=vs;const vt=vp.addScaledVector(n,-vp.dot(n)),vtl=vt.length();
  if(vtl>1e-6){const tdir=vt.multiplyScalar(-1/vtl).clone(),kt=1+tdir.dot(_t.copy(r).cross(tdir).applyMatrix3(I).cross(r)),jt=Math.min(vtl/kt,PHYS_MU*J);
   b.v.addScaledVector(tdir,jt);b.w.add(_t.copy(r).cross(tdir).multiplyScalar(jt).applyMatrix3(I));}
  for(let it=0;it<2;it++)normalPass();}
 let push=0,pn=null;for(const c of contacts)if(c.d>push){push=c.d;pn=c.n;}
 if(pn)b.c.addScaledVector(pn,push*.85);
 b.w.multiplyScalar(contacts.length?.99985:.99995);
 return contacts.length;}
function updateDrops(dt){
 const h=Math.min(dt,.05)/PHYS_SUB;
 for(const b of bodies){if(b.asleep)continue;let touching=0;for(let s=0;s<PHYS_SUB;s++)touching=stepBody(b,h);
  if(touching&&b.v.length()<.03&&b.w.length()<.12)b.still+=dt;else b.still=0;
  if(b.still>.8||b.c.y<-3)b.asleep=true;
  b.mesh.quaternion.copy(b.q).multiply(meshFix);b.mesh.position.copy(b.c).add(_t.set(0,-PHYS_COM,0).applyQuaternion(b.q));}
 while(bodies.length>14){const i=bodies.findIndex(x=>x.asleep);if(i<0)break;machine.remove(bodies[i].mesh);bodies.splice(i,1);}
 beltSurfaceV=0;}
// Hollow magazine with exposed rim and lower feed slot.
const mag=new T.Group();machine.add(mag);mag.position.set(0,1.3,-.15);const ring=new T.Shape();ring.absarc(0,0,.49,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,.435,0,Math.PI*2,true);ring.holes.push(hole);const mg=new T.Mesh(new T.ExtrudeGeometry(ring,{depth:3.55,bevelEnabled:false,steps:1,curveSegments:64}),steel);mg.rotation.x=-Math.PI/2;mg.position.y=.33;mg.castShadow=true;mag.add(mg);cyl(.54,.12,alu,0,.24,0,'y',mag);for(const x of [-.49,.49])box(.12,.45,.75,brushed,x,.1,0,mag);box(1.35,.1,1.35,alu,0,-.19,0,mag);for(const x of [-.58,.58])bolt(x,-.12,.5,mag);
// Three downward-looking sensor brackets across the conveyor.
// Demonstration presets, not measured sensor specifications. PHOTO assumes a
// reflective sensor adjusted so the black sample is below its threshold.
const materialSignals={
  yellow:{photo:true,cap:true,ind:false,name:'เหลือง'},
  black:{photo:false,cap:true,ind:false,name:'ดำ'},
  metal:{photo:true,cap:true,ind:true,name:'อะลูมิเนียม'}
};
const sensorOrder=['photo','cap','ind'];
const sensorPositions=sensorOrder.map((id,i)=>({id,x:-.85+i*.85,z:-1.72}));
function sensorOverlap(position,sensor){return Math.hypot(position.x-sensor.x,position.z-sensor.z)<=partOuterRadius+.04 && Math.abs(position.y-partRestY)<.08;}
const sensorLEDs={};const semit=mat('#0d7d49',.1,.25);for(let i=0;i<3;i++){let x=sensorPositions[i].x;box(.48,.08,1.1,brushed,x,2,-1.9);box(.48,.73,.08,brushed,x,1.65,-2.43);cyl(.21,.75,sensorOrder[i]==='cap'?black:steel,x,2.1,-1.72);for(let j=0;j<7;j++)cyl(.218,.018,brushed,x,1.85+j*.055,-1.72);cyl(.27,.07,alu,x,2.04,-1.72);cyl(.19,.045,rubber,x,1.71,-1.72);const lm=semit.clone();const led=cyl(.155,.07,lm,x,2.51,-1.72);sensorLEDs[sensorPositions[i].id]=led;tube([[x,2.6,-1.72],[x+.2,2.9,-1.8],[x+.35,1.3,-2.6],[1.8,.8,-2.9],[3,.8,-2.8]],black,.035);bolt(x,2.07,-2.2);}
// Slotted grey cable trunking.
// Slotted PVC wire duct: comb fingers on both walls (open slots from the top), wire bundle visible inside, snap-on cover.
const ductGrey=mat('#9ea6a6',.15,.55),ductInside=mat('#4b5355',.1,.7);
function duct(x,z,len,alongX=true){const g=new T.Group();g.position.set(x,.7,z);if(!alongX)g.rotation.y=Math.PI/2;machine.add(g);
 box(len,.04,.5,ductGrey,0,-.23,0,g);                                   // floor
 box(len-.02,.34,.42,ductInside,0,-.05,0,g);                            // wires seen through the slots
 for(const s of [-1,1]){box(len,.17,.03,ductGrey,0,-.165,s*.235,g);   // solid lower wall
  for(let t=-len/2+.04;t<len/2-.03;t+=.12)box(.07,.33,.03,ductGrey,t,.085,s*.235,g);} // fingers, 0.05 slots
 box(len,.05,.56,ductGrey,0,.275,0,g);                                  // cover
 for(const s of [-1,1])box(len,.03,.02,ductGrey,0,.24,s*.27,g);}      // cover lips
duct(.65,1.65,9.3);duct(-.9,2.65,2.5,false);duct(2.1,.35,2.05,false);
// Perimeter air lines secured by black clips.


// Air preparation unit: clear bowls, regulator, shutoff.
const airStart=machine.children.length;
box(2,.1,1.2,steel,-4.2,.65,2);for(let i=0;i<2;i++){let x=-4.8+i*.72;box(.62,.6,.65,white,x,1.65,2);cyl(.24,.72,trans,x,1,2);cyl(.19,.1,alu,x,.62,2);cyl(.08,.17,dark,x,.5,2);}cyl(.25,.45,grey,-4.8,2.16,2);for(let a=0;a<12;a++){let an=a*Math.PI/6;box(.04,.4,.04,alu,-4.8+Math.cos(an)*.25,2.16,2+Math.sin(an)*.25);}cyl(.23,.14,steel,-4.8,1.72,1.6,'z');cyl(.195,.15,white,-4.8,1.72,1.58,'z');box(.015,.17,.015,dark,-4.8,1.75,1.49);box(.5,.4,.65,white,-3.3,1.65,2);cyl(.23,.37,red,-3.3,2.03,2);
for(const item of machine.children.slice(airStart))item.position.z+=1.05;
// Valve manifold and airlines.
const valveStart=machine.children.length;
box(1.35,.2,.9,alu,-2.5,.75,1.8);
// SMC SY3120-style 5/2 solenoid valves: resin body, metal coil, clear connector cover with LED,
// blue manual override, two one-touch fittings (ports A/B) with white release collars.
{const body=mat('#dcddd8',.05,.55),endCap=mat('#cfd0cb',.05,.6),coilMetal=mat('#9a9c9c',.75,.38),coilBase=mat('#4a4d50',.3,.5),
 nickel=mat('#c9ccce',.9,.22),collar=mat('#f1f1ec',0,.45),override=mat('#1f6fd1',.1,.35),
 clear=new T.MeshPhysicalMaterial({color:'#eef4f6',transparent:true,opacity:.42,roughness:.08,metalness:0,depthWrite:false});
 const sideLabel=(()=>{const c=document.createElement('canvas');c.width=620;c.height=360;const g=c.getContext('2d');g.fillStyle='#dcddd8';g.fillRect(0,0,620,360);
  g.fillStyle='#3a3d40';g.font='600 58px "IBM Plex Mono", monospace';g.fillText('SY3120-5LZE-C6',22,86);
  g.strokeStyle='#3a3d40';g.lineWidth=5;g.strokeRect(40,150,120,70);g.strokeRect(160,150,120,70);g.beginPath();g.moveTo(60,215);g.lineTo(140,160);g.moveTo(180,160);g.lineTo(180,215);g.moveTo(260,160);g.lineTo(260,215);g.stroke();
  g.font='500 30px "IBM Plex Sans Thai", Arial';g.fillText('SUP',340,180);g.fillText('0.15 – 0.7 MPa',340,220);g.font='700 34px "IBM Plex Sans Thai", Arial';g.fillText('SMC',40,300);g.font='500 28px "IBM Plex Sans Thai", Arial';g.fillText('JAPAN',300,300);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return new T.MeshStandardMaterial({map:t,roughness:.55});})();
 for(let j=0;j<3;j++){const x=-2.95+j*.4;
  box(.3,.36,.6,body,x,1.03,1.86);                       // valve body on the manifold
  box(.3,.33,.06,endCap,x,1.025,1.53);                    // front end plate
  box(.26,.03,.32,endCap,x,1.225,1.74);                   // fitting plate
  for(const z of [1.6,1.88])cyl(.016,.012,nickel,x+.09,1.245,z,'y');
  for(const z of [1.66,1.82]){cyl(.072,.15,nickel,x,1.31,z,'y');cyl(.076,.035,collar,x,1.4,z,'y');cyl(.042,.012,dark,x,1.42,z,'y');}
  box(.07,.05,.06,override,x,1.235,2.11);                 // manual override tab
  box(.3,.3,.22,coilMetal,x,1.08,2.27);box(.3,.11,.22,coilBase,x,.9,2.27); // solenoid coil + base
  const cover=box(.28,.32,.13,clear,x,1.06,2.445);cover.castShadow=false;  // clear DIN connector cover
  box(.16,.18,.07,mat('#c9c3a8',.1,.5),x,1.07,2.44);
  const led=mat('#ff6a2a',0,.3);led.emissive=new T.Color('#ff5a1a');led.emissiveIntensity=.6;box(.04,.03,.02,led,x,1.17,2.5);
  tube([[x,.98,2.51],[x,.9,2.6],[x+.05,.74,2.64]],mat('#7d8285',.1,.5),.022);  // coil cable
  const lbl=new T.Mesh(new T.PlaneGeometry(.52,.3),sideLabel);lbl.position.set(x+.152,1.03,1.84);lbl.rotation.y=Math.PI/2;lbl.scale.x=-1;machine.add(lbl);
 }}
for(const item of machine.children.slice(valveStart))item.position.z+=.95;
// Reconnect relocated valve outlets to the three cylinder banks.
// Air supply: short connection behind the valve manifold.
tube([[-3.05,1.65,3.05],[-2.90,1.65,3.05],[-2.78,1.52,3.25],[-2.78,1.15,3.25],[-2.55,1.10,3.18]],blue,.032);
// Dedicated paired lines: buried trunk sections, then short service loops at each cylinder.
// No decorative open-ended hoses across the front of the station.
const pneumaticRoutes=[{x:-2.1,z:.43},{x:0,z:1.7},{x:3,z:.43}];
for(const [i,unit] of pneumaticRoutes.entries()){
 const valveX=-2.95+i*.4;
 for(const [j,portZ] of [-.66,.92].entries()){
  const laneZ=1.50+i*.065+j*.028;
  const sideX=unit.x+.70+j*.09;
  const portY=pusherAxisY-.7+1.17;
  const endZ=unit.z+portZ;
  const fz=1.66+.95+j*.16,fx=valveX-.05+j*.1;
  const hose=tube([[valveX,1.42,fz],[valveX,1.56,fz],[(valveX+fx)/2,1.7,fz-.16],[fx,1.68,2.34],[fx,1.42,2.2],
    [valveX+j*.08,.84,2.20],[valveX+j*.08,.80,laneZ],
    [sideX,.80,laneZ],[sideX,.84,unit.z+1.05],
    [sideX,portY,unit.z+1.05],[sideX,portY,endZ],
    [unit.x+.42,portY+.04,endZ],[unit.x+.21,portY,endZ]],blue,.026);
  // Fit a small band to the actual spline, not an estimated straight-line position.
  const path=hose.userData.path;
  const target=new T.Vector3(sideX,portY,(unit.z+1.05+endZ)/2);
  let tieT=0,best=Infinity;
  for(let k=0;k<=400;k++){const t=k/400,d=path.getPoint(t).distanceToSquared(target);if(d<best){best=d;tieT=t;}}
  const band=new T.Mesh(new T.TorusGeometry(.028,.004,6,24),black);
  band.position.copy(path.getPoint(tieT));
  band.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),path.getTangent(tieT).normalize());
  band.castShadow=true;machine.add(band);
 }
}

// Remote I/O block and power supply, screw terminal detail.
// Detailed CC-Link remote I/O housing, with a printed top panel and recessed terminals.
box(3.30,.66,1.02,black,3.45,1.10,3.0);
box(3.14,.06,.70,dark,3.45,1.46,3.15);
const ioCanvas=document.createElement('canvas');ioCanvas.width=1800;ioCanvas.height=440;
const ioCtx=ioCanvas.getContext('2d');ioCtx.fillStyle='#303534';ioCtx.fillRect(0,0,1800,440);
function ioPrint(label,x,y,size=24,color='#e3e7df'){ioCtx.fillStyle=color;ioCtx.font=size+'px Arial';ioCtx.fillText(label,x,y);}
ioPrint('MITSUBISHI ELECTRIC',25,42,25);ioPrint('PW  RUN  D LINK  ERR',25,92,22);
ioPrint('IP ADDRESS',315,55,25);ioPrint('200 100 80 40 20 10 8 4 2 1',315,91,18);
ioPrint('CC-Link IE Field Basic',950,298,30);ioPrint('NZ2MFB1-32DTE1',1360,298,28);
for(let i=0;i<16;i++){
 const x=650+i*66;
 ioPrint(i.toString(16).toUpperCase(),x,47,22);
 ioCtx.fillStyle='#bfc8bc';ioCtx.fillRect(x,62,40,52);
 ioCtx.fillStyle='#262d29';ioCtx.fillRect(x+9,72,22,31);
 ioCtx.fillStyle='#8b4242';ioCtx.fillRect(x,131,40,52);
 ioPrint(i.toString(16).toUpperCase(),x+10,168,20);
 ioCtx.fillStyle=i<8?'#d8ddd5':'#934e4d';ioCtx.fillRect(22+i*108,342,102,60);
 ioPrint((i<8?'X':'Y')+i.toString(16).toUpperCase(),38+i*108,382,25,i<8?'#303932':'#fff4ec');
}
const ioMap=new T.CanvasTexture(ioCanvas);ioMap.colorSpace=T.SRGBColorSpace;
const ioFace=new T.Mesh(new T.PlaneGeometry(3.10,.69),new T.MeshStandardMaterial({map:ioMap,roughness:.75}));
ioFace.rotation.x=-Math.PI/2;ioFace.scale.x=-1;ioFace.position.set(3.45,1.495,3.15);machine.add(ioFace);
// DIP switch banks: recessed wells with individual white rockers.
for(const [cx,n] of [[2.12,4],[2.62,10]]){
 box(n*.035+.045,.02,.12,black,cx,1.51,3.10);
 for(let i=0;i<n;i++)box(.022,.022,.055,white,cx+(i-(n-1)/2)*.035,1.53,3.10);
}
const ccInputLEDs={};
for(let i=0;i<16;i++){
 const lm=mat('#273d29',.05,.38);lm.emissive=new T.Color('#35e66c');lm.emissiveIntensity=0;
 const led=box(.035,.016,.045,lm,3.02+i*.119,1.513,3.37);
 if(i<3)ccInputLEDs[sensorOrder[i]]=led;
}
for(let i=0;i<2;i++){const lm=mat('#80c53e');lm.emissive=new T.Color('#66ee33');lm.emissiveIntensity=.7;box(.035,.018,.04,lm,2.03+i*.09,1.514,3.34);}
box(3.06,.16,.24,dark,3.45,1.06,2.40);
for(let i=0;i<16;i++){
 const x=2.04+i*.187;
 cyl(.069,.014,black,x,1.148,2.40);cyl(.048,.016,steel,x,1.158,2.40);
 box(.062,.006,.010,dark,x,1.169,2.40);
 const wireMat=[blue,black,black,blue,white,red][i%6];
 tube([[x,1.06,2.33],[x,1.02,2.23],[x,.90,2.04],[x,.79,1.74]],wireMat,.014);
 const sleeve=cyl(.025,.18,white,x,1.0,2.20,'z');sleeve.rotation.x=Math.PI*.32;
 text((i<8?'RX':'RY')+String(i).padStart(2,'0'),.12,.034,x,1.055,2.20,machine,-Math.PI/2,'#e6e8e1','#37423e');
}
// S8VK-G12024-inspired power supply; visual reference only, no electrical connection.
const psu=new T.Group();psu.position.set(5.51,.66,2.90);machine.add(psu);
const psuCase=mat('#343735',.25,.53),psuFace=mat('#292d2b',.12,.62);
box(.78,1.36,1.90,psuCase,0,.72,0,psu);
// Brushed dark-bronze top face, as on the reference unit.
{const c=document.createElement('canvas');c.width=128;c.height=512;const g=c.getContext('2d');g.fillStyle='#2a2a28';g.fillRect(0,0,128,512);
 for(let i=0;i<900;i++){g.fillStyle=i%2?'rgba(110,106,98,.10)':'rgba(8,8,8,.14)';g.fillRect(Math.random()*128,Math.random()*512,1,30+Math.random()*90);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;psuFace.map=t;psuFace.color.set('#ffffff');psuFace.metalness=.45;psuFace.roughness=.42;}
box(.74,.07,1.85,psuFace,0,1.435,0,psu);
// Chamfered shoulders between the top face and the side covers.
for(const x of [-.37,.37]){const ch=box(.07,.07,1.86,psuCase,x,1.40,0,psu);ch.rotation.z=x>0?-.6:.6;}
box(.85,.07,1.60,steel,0,.035,0,psu);
// Long inset spine with raised edges on the front face.
box(.095,.012,.75,black,0,1.477,-.08,psu);
for(const x of [-.062,.062])box(.018,.023,.78,psuCase,x,1.483,-.08,psu);
// Output terminal bank at the rear; input terminal bank at the front.
for(const [z,count] of [[.80,5],[-.80,3]]){
 const spacing=count===5?.135:.19;
 box(count*spacing+.04,.105,.22,dark,0,1.49,z,psu);
 for(let i=0;i<count;i++){
  const x=(i-(count-1)/2)*spacing;
  box(spacing-.012,.022,.19,psuFace,x,1.55,z,psu);
  cyl(.051,.013,black,x,1.566,z,'y',psu);
  cyl(.034,.014,steel,x,1.574,z,'y',psu);
  box(.045,.005,.008,black,x,1.584,z,psu);
  for(const dz of [-.078,.078])box(.065,.009,.018,black,x,1.568,z+dz,psu);
 }
}
// Printed top-face legends: one sharp sRGB decal, laid out like the reference unit.
{const S=500,c=document.createElement('canvas');c.width=.72*S;c.height=1.40*S;const g=c.getContext('2d');
 const px=x=>(.36-x)*S, pz=z=>(z+.70)*S; // canvas left = local +x (plane is mirrored), canvas top = local -z
 const put=(s,x,z,size,weight='600',align='center',color='#d9ddd6')=>{g.font=weight+' '+size+'px Arial';g.fillStyle=color;g.textAlign=align;g.textBaseline='middle';g.fillText(s,px(x),pz(z));};
 g.fillStyle='#c9cdc6';g.fillRect(px(.30),pz(.505),.60*S,.085*S); // light band behind OUTPUT rating
 put('24VDC 5.0A  OUTPUT',0,.548,21,'700','center','#2a2c2a');
 put('+   +        −   −   −',0,.625,24,'700');
 put('omron',.27,.47,26,'700','left');put('S8VK-G12024',.27,.405,30,'800','left');put('POWER SUPPLY',.27,.345,19,'500','left');
 put('DC ON',.22,.165,15,'600');put('V.ADJ',.22,-.035,15,'600');
 g.strokeStyle='#c9cdc6';g.lineWidth=2;g.strokeRect(px(.30),pz(-.565),.60*S,.13*S);
 put('INPUT',0,-.535,17,'700');put('100-240VAC 50/60Hz 1.6A',0,-.585,15,'500');put('or 90-350VDC 1.8A',0,-.62,15,'500');
 put('L          N          ⏚',0,-.668,17,'700');
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;
 const decal=new T.Mesh(new T.PlaneGeometry(.72,1.40),new T.MeshStandardMaterial({map:t,transparent:true,roughness:.5,depthWrite:false}));
 decal.rotation.x=-Math.PI/2;decal.scale.x=-1;decal.position.set(0,1.4715,0);psu.add(decal);}
const powerLamp=mat('#a4d632');powerLamp.emissive=new T.Color('#79dd29');powerLamp.emissiveIntensity=.65;
box(.055,.016,.035,powerLamp,.22,1.49,.055,psu);
cyl(.065,.009,grey,.22,1.481,-.12,'y',psu);
cyl(.047,.012,black,.22,1.489,-.12,'y',psu);
cyl(.026,.008,beige,.22,1.498,-.12,'y',psu);
box(.035,.005,.007,dark,.22,1.505,-.12,psu);
// Side covers: recessed panel, centre screw and printed rating label.
const psuLabelCanvas=document.createElement('canvas');psuLabelCanvas.width=760;psuLabelCanvas.height=560;
{const g=psuLabelCanvas.getContext('2d');g.fillStyle='#1f2221';g.fillRect(0,0,760,560);g.fillStyle='#c9cec7';
 g.font='bold 46px Arial';g.fillText('omron S8VK-G12024',30,70);g.font='30px Arial';g.fillText('POWER SUPPLY',30,110);
 g.font='24px Arial';['INPUT: 100-240VAC 1.6A 50/60Hz','            90-350VDC 1.8A','OUTPUT: 24VDC 5.0A','Ambient Temp: -40 to 70°C'].forEach((s,i)=>g.fillText(s,30,165+i*34));
 g.strokeStyle='#c9cec7';g.lineWidth=3;g.font='bold 34px Arial';[['CE',30],['UL',110],['UK CA',190],['RCM',330]].forEach(([s,x])=>{g.strokeRect(x-6,330,s.length*24+18,52);g.fillText(s,x+2,370);});
 g.fillStyle='#e6e8e2';g.fillRect(30,430,170,46);g.fillStyle='#1f2221';g.font='bold 26px Arial';g.fillText('LOT 1Z6D',42,462);
 g.fillStyle='#c9cec7';g.font='22px Arial';g.fillText('OMRON Corporation   MADE IN CHINA',230,462);g.fillText('⚠ HOT SURFACE',30,525);}
const psuLabelMap=new T.CanvasTexture(psuLabelCanvas);psuLabelMap.colorSpace=T.SRGBColorSpace;
for(const x of [-.394,.394]){
 box(.012,1.02,1.62,dark,x,.72,0,psu);
 cyl(.035,.016,black,x,1.12,.25,'x',psu);
 const lbl=new T.Mesh(new T.PlaneGeometry(1.05,.78),new T.MeshStandardMaterial({map:psuLabelMap,roughness:.6}));
 lbl.position.set(x+Math.sign(x)*.008,.70,-.05);lbl.rotation.y=Math.sign(x)*Math.PI/2;lbl.scale.x=-1;psu.add(lbl);
}
// Perforated vent grille on the input-end face, plus the DIN-rail clip tab.
box(.66,1.05,.012,dark,0,.70,-.956,psu);
for(let row=0;row<9;row++)for(let col=0;col<6;col++)box(.07,.05,.016,black,-.25+col*.1+(row%2)*.05-.025,.30+row*.09,-.958,psu);
box(.22,.16,.05,steel,0,.12,-.98,psu);cyl(.035,.06,dark,0,.12,-1.0,'z',psu);
// Short paired output wires drop toward the rear cable route.
for(let i=0;i<2;i++)tube([[5.37+i*.135,2.25,3.70],[5.37+i*.135,2.40,3.81],[5.37+i*.135,2.32,3.92],[5.37+i*.135,.82,3.92]],i?black:blue,.018);
box(2.2,.25,.8,dark,3.9,.8,.95);for(let i=0;i<11;i++){let x=2.95+i*.19;box(.17,.24,.68,trans,x,1.04,.95);bolt(x,1.2,.85);}
// Three Omron MY2N-GS-style plug-in relays on black PYF08A-style screw-terminal sockets.
// Relay lies with its nameplate facing up (+y); the relay's "top" (test button, indicator flag) points to -z.
const relayCover=new T.MeshPhysicalMaterial({color:'#f2f8fa',transparent:true,opacity:.2,roughness:.05,metalness:0,clearcoat:1,clearcoatRoughness:.05,depthWrite:false});
const relayFrame=mat('#f1f0e9',0,.5),relayFlag=mat('#ff5b3a',.05,.42),relayBlue=mat('#2f6fd6',.05,.35),relayBase=mat('#3a3d40',.2,.55),
 relaySilver=mat('#d5d9dc',.95,.2),relayCopper=mat('#a76530',.65,.38),socketBlack=mat('#16191b',.15,.5),screwSteel=mat('#c4c8cb',.9,.25);
const relayPlate=(()=>{const c=document.createElement('canvas');c.width=330;c.height=480;const g=c.getContext('2d');
 g.fillStyle='#e8eae7';g.fillRect(0,0,330,480);g.strokeStyle='#c9ccc9';g.lineWidth=3;g.strokeRect(2,2,326,476);
 g.fillStyle='#2a3a52';g.font='800 62px Arial';g.fillText('omron',22,72);
 g.fillStyle='#2b2f33';g.font='600 34px "IBM Plex Sans Thai", Arial';g.fillText('MY2N-GS',22,122);g.font='500 28px "IBM Plex Sans Thai", Arial';g.fillText('24VDC',22,160);
 g.lineWidth=4;g.strokeStyle='#2b2f33';g.beginPath();g.arc(258,138,20,Math.PI*.35,Math.PI*1.65);g.stroke();g.beginPath();g.arc(296,138,20,Math.PI*.35,Math.PI*1.65);g.moveTo(282,138);g.lineTo(300,138);g.stroke();
 g.fillStyle='#2b2f33';g.font='500 22px "IBM Plex Sans Thai", Arial';['5A','30VDC','5A','250VAC'].forEach((s,i)=>g.fillText(s,222,330+i*28));
 g.strokeStyle='#2b2f33';g.lineWidth=3;g.beginPath();g.arc(52,430,20,0,Math.PI*2);g.stroke();g.font='700 18px Arial';g.fillText('UL',41,437);
 g.beginPath();g.arc(112,430,20,0,Math.PI*2);g.stroke();g.fillText('SP',101,437);g.strokeRect(150,412,46,36);g.font='700 16px Arial';g.fillText('CCC',154,436);
 g.fillStyle='#4a4f55';g.font='500 18px "IBM Plex Sans Thai", Arial';g.fillText('JAPAN',230,450);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return new T.MeshStandardMaterial({map:t,roughness:.5});})();
const relayLEDs=[];
box(1.18,.12,1.15,alu,1.35,.64,-.05);
for(let i=0;i<3;i++){
 const x=.95+i*.4;
 // Socket: body, raised relay seat, 4 screw terminals per end (two tiers), hold-down clip.
 box(.35,.16,.86,socketBlack,x,.78,-.05);
 box(.33,.05,.62,mat('#24282b',.15,.55),x,.885,-.05);
 for(const [z,y] of [[-.42,.87],[.32,.87],[-.36,.9],[.26,.9]])for(const dx of [-.09,.09]){
  box(.13,.03,.07,socketBlack,x+dx,y-.02,z);cyl(.035,.02,screwSteel,x+dx,y,z,'y');box(.05,.006,.01,dark,x+dx,y+.012,z);}
 box(.2,.13,.025,mat('#5d6368',.6,.4),x,.97,-.385);box(.16,.025,.06,mat('#5d6368',.6,.4),x,1.03,-.36);
 // Relay base with pin plate.
 box(.3,.03,.56,relayBase,x,.925,-.05);
 // Inner white frame, coil peeking at the back, silver contact springs on the visible side.
 box(.27,.24,.4,relayFrame,x,1.06,-.01);
 box(.2,.12,.14,relayCopper,x-.02,1.0,.13);
 for(const z of [-.12,.07]){box(.01,.2,.026,relaySilver,x+.13,1.06,z);box(.01,.026,.09,relaySilver,x+.13,1.155,z-.035);
  box(.01,.12,.022,relaySilver,x+.13,1.1,z-.08);cyl(.014,.012,relaySilver,x+.136,1.11,z-.08,'x');}
 // Mechanical indicator assembly (orange-red) and blue lockable test button at the relay top (-z end).
 box(.26,.12,.09,relayFlag,x,1.17,-.27);for(let k=0;k<3;k++)box(.26,.012,.012,mat('#e04a2c',.05,.45),x,1.235,-.305+k*.025);
 box(.06,.04,.05,relayFrame,x+.07,1.24,-.28);
 box(.11,.02,.08,mat('#cfd4d6',.1,.4),x,1.282,-.305);box(.07,.05,.05,relayBlue,x,1.3,-.305);
 // Printed nameplate under the front of the cover, green coil LED at its lower left.
 const plate=new T.Mesh(new T.PlaneGeometry(.29,.42),relayPlate);plate.rotation.x=-Math.PI/2;plate.scale.x=-1;plate.position.set(x,1.272,.03);machine.add(plate);
 const lm=mat('#2b7a3a',.1,.25);lm.emissive=new T.Color('#3dff62');lm.emissiveIntensity=.15;const led=cyl(.022,.012,lm,x-.09,1.277,.13,'y');relayLEDs.push(led);
 // Clear polycarbonate cover with crisp edges.
 const cover=box(.31,.34,.58,relayCover,x,1.115,-.05);cover.castShadow=false;
 const edges=new T.LineSegments(new T.EdgesGeometry(cover.geometry),new T.LineBasicMaterial({color:'#b9c7c4',transparent:true,opacity:.7}));
 edges.position.copy(cover.position);machine.add(edges);
 // Wiring from the end terminals down to the trunking.
 for(const z of [-.42,.32]){tube([[x-.09,.87,z],[x-.09,.74,z-.1],[1.85,.69,z-.12]],black,.018);}
}
// ABB S202M C32-style two-pole MCB on a DIN rail. Long axis = z (top terminals at -z), front faces +y.
const breaker=new T.Group();breaker.position.set(5.515,.66,.95);breaker.rotation.y=Math.PI;machine.add(breaker);
{const B=breaker;
 const shell=mat('#ecedea',.02,.58),shellShade=mat('#dfe0dc',.02,.62),recess=mat('#2b2e31',.2,.55),screwZn=mat('#bfc3c6',.85,.3),
  handleBlack=new T.MeshPhysicalMaterial({color:'#1b1e21',roughness:.45,clearcoat:.4,clearcoatRoughness:.35}),
  redWin=mat('#c8262c',.05,.35);redWin.emissive=new T.Color('#b0141a');redWin.emissiveIntensity=.25;
 // Mounting plate and 35 mm DIN top-hat rail across both poles.
 box(.96,.06,1.76,grey,0,.03,0,B);
 box(1.02,.025,.36,steel,0,.075,0,B);for(const z of [-.16,.16])box(1.02,.05,.03,steel,0,.1,z,B);box(1.02,.02,.26,steel,0,.12,0,B);
 for(const x of [-.225,.225]){
  // Stepped housing: base, terminal shoulders, raised front cover with a narrower cap (bevel look).
  box(.436,.34,1.68,shell,x,.3,0,B);
  for(const z of [-.67,.67])box(.436,.1,.34,shell,x,.52,z,B);
  box(.436,.2,1.0,shell,x,.57,0,B);
  box(.416,.03,.96,shellShade,x,.685,0,B);
  for(const z of [-.5,.5])box(.436,.12,.012,shellShade,x,.53,z,B);       // step faces
  // Terminals: square recess, combination (slot + cross) screw, wire entry in the end face.
  for(const z of [-.67,.67]){
   box(.3,.012,.26,recess,x,.571,z,B);
   cyl(.092,.02,screwZn,x,.585,z,'y',B);cyl(.07,.012,mat('#a9adb1',.85,.35),x,.597,z,'y',B);
   box(.13,.008,.022,recess,x,.604,z,B);box(.022,.008,.13,recess,x,.604,z,B);
   for(let k=0;k<8;k++){const a=k*Math.PI/4;box(.012,.006,.012,recess,x+Math.cos(a)*.08,.596,z+Math.sin(a)*.08,B);}
   box(.3,.17,.012,recess,x,.33,z<0?-.846:.846,B);
   box(.22,.11,.014,screwZn,x,.33,z<0?-.85:.85,B);
  }
  // Printed front cover (one decal per pole; left pole carries the rating, right pole the circuit symbols).
  const left=x<0;
  const c=document.createElement('canvas');c.width=420;c.height=1000;const g=c.getContext('2d');
  g.fillStyle='#ecedea';g.fillRect(0,0,420,1000);
  g.fillStyle='#d1222b';g.fillRect(0,128,420,16);
  if(left){g.font='800 74px Arial';g.fillText('ABB',26,108);}
  g.fillStyle='#2b2f33';
  if(left){g.font='600 58px "IBM Plex Sans Thai", Arial';g.fillText('S202M',26,226);g.font='700 80px "IBM Plex Sans Thai", Arial';g.fillText('C32',26,318);g.font='500 38px "IBM Plex Sans Thai", Arial';g.fillText('400V~',26,370);}
  else{g.strokeStyle='#2b2f33';g.lineWidth=6;for(const sx of [140,280]){g.beginPath();g.moveTo(sx,170);g.lineTo(sx,215);g.lineTo(sx-40,290);g.moveTo(sx,300);g.lineTo(sx,350);g.moveTo(sx-16,200);g.lineTo(sx+16,230);g.moveTo(sx+16,200);g.lineTo(sx-16,230);g.stroke();}
   g.setLineDash([10,8]);g.beginPath();g.moveTo(110,255);g.lineTo(250,255);g.stroke();g.setLineDash([]);}
  g.fillStyle='#3b3f43';g.fillRect(40,480,340,240);                       // handle recess print
  g.font='500 24px "IBM Plex Sans Thai", Arial';g.fillStyle='#5b6066';g.fillText(left?'AAN  I  ON':'IEC/EN 60898-1',40,900);
  g.font='500 22px "IBM Plex Sans Thai", Arial';g.fillText(left?'Icn 6000':'3',left?40:360,940);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
  const cover=new T.Mesh(new T.PlaneGeometry(.416,.96),new T.MeshStandardMaterial({map:tex,roughness:.55}));
  cover.rotation.x=-Math.PI/2;cover.scale.x=-1;cover.position.set(x,.7015,0);B.add(cover);
  // Handle slot, red contact-position window (red = contacts closed / ON).
  box(.34,.02,.24,recess,x,.705,.1,B);
  box(.08,.014,.045,redWin,x,.707,.31,B);box(.1,.008,.065,recess,x,.703,.31,B);
 }
 // Linked toggle: one moulded black handle across both poles, ribbed, printed ON, tipped to the ON side.
 const H=new T.Group();H.position.set(0,.715,.1);H.rotation.x=-.14;B.add(H);
 box(.86,.09,.17,handleBlack,0,.045,0,H);box(.82,.025,.15,handleBlack,0,.1,-.005,H);
 for(let k=0;k<3;k++)box(.8,.006,.01,mat('#2c3034',.2,.5),0,.116,-.065+k*.025,H);
 box(.02,.1,.175,mat('#0f1113',.2,.5),0,.055,0,H);                         // pole split line
 for(const x of [-.225,.225])text('ON',.11,.045,x,.1135,.04,H,-Math.PI/2,'#1b1e21','#f2f2ee');
 cyl(.03,.88,steel,0,.0,0,'x',H);                                          // pivot pin
}
// Emergency stop on station.
box(.58,.35,.65,grey,-5.55,.88,1.1);cyl(.25,.05,yellow,-5.55,1.08,1.1);cyl(.17,.22,red,-5.55,1.2,1.1);
// Separate floor-standing control cabinet, front face points toward -Z.
// Door layout follows the training-panel photo: 3 rows of pilot lamps, then MASTER ON / CONTROL POWER ON / CONTROL ON,
// two rows of inputs (key switch, selector, pushbuttons), the emergency stop, lever handle and stickers.
const cab=new T.Group();machine.add(cab);cab.position.set(8.65,.2,2.2);
const cabPaint=mat('#d3d0c6',.05,.72),chrome=mat('#dfe3e6',1,.14),bezelBlack=mat('#121416',.25,.32),plateWhite=mat('#f4f4f0',0,.55);
box(3.9,5.6,1.15,cabPaint,0,2.9,0,cab);box(3.82,5.48,.08,cabPaint,0,2.9,-.62,cab);
for(let x of [-1.88,1.88])box(.015,5.4,.02,dark,x,2.9,-.669,cab);
for(let y of [1.3,4.6])box(.09,.3,.16,steel,1.96,y,-.45,cab);
for(let x of [-1.5,1.5])box(.24,.25,.7,dark,x,.05,0,cab);
const Z0=-.66; // door front surface
// Printed decal facing the viewer (same orientation convention as text()).
function decal(w,h,pw,ph,draw,x,y,z=Z0-.004,parent=cab){const c=document.createElement('canvas');c.width=pw;c.height=ph;const g=c.getContext('2d');draw(g,pw,ph);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,transparent:true,roughness:.5}));m.position.set(x,y,z);m.rotation.y=Math.PI;m.scale.x=-1;parent.add(m);return m;}
const ui=(g,wt,px)=>g.font=wt+' '+px+'px "IBM Plex Sans Thai", Arial';
// White legend plate above each device.
function legend(label,x,y){box(.3,.17,.018,plateWhite,x,y,Z0-.009,cab);
 decal(.28,.15,336,180,(g,w,h)=>{g.fillStyle='#1c1d1f';g.textAlign='center';g.textBaseline='middle';const parts=label.split('\n');ui(g,600,parts.length>1?40:46);parts.forEach((s,i)=>g.fillText(s,w/2,h/2+(i-(parts.length-1)/2)*44));},x,y,Z0-.019);}
const clickables=[],pilot=[];
function clickable(meshes,data){const d={visual:()=>{},...data};for(const m of meshes){m.userData=d;clickables.push(m);}return d;}
// 22 mm pilot lamp: black bezel, ribbed domed lens that glows when the output is on.
function lamp(x,y,label,color,glow,buzzer=false){legend(label,x,y+.235);
 cyl(.15,.05,bezelBlack,x,y,Z0-.025,'z',cab);
 const lm=new T.MeshPhysicalMaterial({color,emissive:new T.Color(glow),emissiveIntensity:.05,roughness:.18,clearcoat:1,clearcoatRoughness:.1});
 cyl(.118,.04,lm,x,y,Z0-.065,'z',cab);
 const dome=new T.Mesh(new T.SphereGeometry(.13,40,16,0,Math.PI*2,0,Math.PI*.3),lm);dome.rotation.x=-Math.PI/2;dome.position.set(x,y,Z0-.085+.13*Math.cos(Math.PI*.3));cab.add(dome);
 for(let r=.03;r<.11;r+=.022){const o=new T.Mesh(new T.TorusGeometry(r,.0025,4,40),lm);o.position.set(x,y,Z0-.085-Math.sqrt(Math.max(0,.13*.13-r*r))+.13*Math.cos(Math.PI*.3)-.002);cab.add(o);}
 if(buzzer)for(const s of [-1,1])for(const r of [.035,.06]){const a=new T.Mesh(new T.TorusGeometry(r,.006,4,16,Math.PI*.6),bezelBlack);a.rotation.z=s>0?-Math.PI*.3:Math.PI*.7;a.position.set(x,y,Z0-.128);cab.add(a);}
 pilot.push(dome);return dome;}
// Flush pushbutton (optionally illuminated): black bezel, coloured cap that moves in when pressed.
function pushButton(x,y,label,capColor,action,sig,lit=null){legend(label,x,y+.235);
 cyl(.125,.06,bezelBlack,x,y,Z0-.03,'z',cab);
 const cm=new T.MeshPhysicalMaterial({color:capColor,roughness:.3,clearcoat:.8,clearcoatRoughness:.2});if(lit){cm.emissive=new T.Color(lit);cm.emissiveIntensity=.45;}
 const cap=cyl(.09,.05,cm,x,y,Z0-.072,'z',cab);
 const ring=new T.Mesh(new T.TorusGeometry(.094,.008,6,40),bezelBlack);ring.position.set(x,y,Z0-.098);cab.add(ring);
 clickable([cap],{kind:'push',action,sig,visual:on=>{cap.position.z=Z0-.072+(on?.03:0);}});return cap;}
// Key switch (spring return): chrome lock, key turns while held, a spare key hangs on the ring.
function keySwitch(x,y,label,action,sig){legend(label,x,y+.235);
 cyl(.125,.05,bezelBlack,x,y,Z0-.025,'z',cab);const face=cyl(.085,.07,chrome,x,y,Z0-.08,'z',cab);
 const k=new T.Group();k.position.set(x,y,Z0-.12);cab.add(k);
 box(.03,.012,.08,chrome,0,0,-.0,k);const bow=new T.Mesh(new T.CylinderGeometry(.055,.055,.014,24),chrome);bow.rotation.x=Math.PI/2;bow.position.set(0,.085,-.03);k.add(bow);box(.04,.06,.014,chrome,0,.035,-.03,k);
 const ringK=new T.Mesh(new T.TorusGeometry(.035,.006,6,20),chrome);ringK.position.set(0,.13,-.03);k.add(ringK);
 const spare=new T.Group();spare.position.set(.02,-.08,-.04);k.add(spare);box(.03,.2,.01,chrome,0,-.12,0,spare);const sb=new T.Mesh(new T.CylinderGeometry(.045,.045,.012,24),chrome);sb.rotation.x=Math.PI/2;sb.position.set(0,0,0);spare.add(sb);spare.rotation.z=.12;
 box(.012,.06,.01,bezelBlack,0,0,-.035,k);
 clickable([face,bow],{kind:'push',action,sig,visual:on=>{k.rotation.z=on?-Math.PI/4:0;}});}
// Two-position selector switch (maintained): black knob with a lever that turns 45°.
function selector(x,y,label,sig){legend(label,x,y+.235);
 cyl(.125,.05,bezelBlack,x,y,Z0-.025,'z',cab);
 const g=new T.Group();g.position.set(x,y,Z0-.06);cab.add(g);
 const knob=cyl(.09,.06,bezelBlack,0,0,-.01,'z',g);const lever=box(.055,.2,.08,bezelBlack,0,0,-.07,g);box(.012,.07,.004,plateWhite,0,.06,-.111,g);
 g.rotation.z=Math.PI/4;
 clickable([knob,lever],{kind:'selector',sig,on:false,visual:on=>{g.rotation.z=on?-Math.PI/4:Math.PI/4;}});}
const holePlug=(x,y)=>{cyl(.085,.03,bezelBlack,x,y,Z0-.015,'z',cab);cyl(.06,.02,mat('#1d2022',.1,.6),x,y,Z0-.035,'z',cab);};

// Row positions taken from the photo (top plug, 3 lamp rows, 2 input rows, E-stop).
holePlug(0,5.3);
lamp(-.57,4.55,'OUTPUT 0','#1f9b4b','#35ff7a');lamp(0,4.55,'OUTPUT 1','#1f9b4b','#35ff7a');lamp(.55,4.55,'OUTPUT 2','#1f9b4b','#35ff7a');
lamp(-.57,3.86,'OUTPUT 3','#5e0f18','#ff2d2d');lamp(0,3.86,'OUTPUT 4','#5e0f18','#ff2d2d');lamp(.55,3.86,'OUTPUT 5','#9c1420','#ff3a3a',true);
pushButton(-.54,3.26,'MASTER ON','#1f9b4b','start','masterOn');
pushButton(0,3.26,'CONTROL\nPOWER ON','#f2b400','start','controlPower','#ffb000');
lamp(.52,3.27,'CONTROL ON','#c9ced6','#ffffff');
keySwitch(-.93,2.76,'INPUT 0','stop','pbIn0');
pushButton(-.44,2.76,'INPUT 1','#18191b','stop','pbIn1');pushButton(.04,2.77,'INPUT 2','#18191b','stop','pbIn2');pushButton(.5,2.79,'INPUT 3','#18191b','stop','pbIn3');
holePlug(.94,2.76);
selector(-.9,2.26,'INPUT 4','pbIn4');
pushButton(-.41,2.26,'INPUT 5','#1f9b4b','start','pbIn5');pushButton(.06,2.27,'INPUT 6','#1f9b4b','start','pbIn6');pushButton(.5,2.29,'INPUT 7','#1f9b4b','start','pbIn7');
holePlug(.91,2.31);

// Emergency stop: yellow legend ring and red mushroom head.
const EX=.06,EY=1.72;
decal(.58,.58,512,512,(g,w,h)=>{g.fillStyle='#f4c21b';g.beginPath();g.arc(w/2,h/2,w/2-4,0,Math.PI*2);g.fill();g.strokeStyle='#c99a00';g.lineWidth=6;g.stroke();
 ui(g,700,58);g.fillStyle='#1a1a1a';g.textAlign='center';g.textBaseline='middle';const s='EMERGENCY',R=w/2-52,span=Math.PI*.78;
 for(let i=0;i<s.length;i++){const a=-Math.PI/2-span/2+span*i/(s.length-1);g.save();g.translate(w/2+R*Math.cos(a),h/2+R*Math.sin(a));g.rotate(a+Math.PI/2);g.fillText(s[i],0,0);g.restore();}},EX,EY,Z0-.006);
cyl(.11,.08,bezelBlack,EX,EY,Z0-.04,'z',cab);cyl(.085,.08,red,EX,EY,Z0-.11,'z',cab);
const esHead=new T.Mesh(new T.SphereGeometry(.18,48,20,0,Math.PI*2,0,Math.PI*.36),new T.MeshPhysicalMaterial({color:'#d01f22',roughness:.28,clearcoat:.7}));esHead.rotation.x=-Math.PI/2;esHead.position.set(EX,EY,Z0-.15+.18*Math.cos(Math.PI*.36));cab.add(esHead);
const esRim=cyl(.16,.05,esHead.material,EX,EY,Z0-.165,'z',cab);
clickable([esHead,esRim],{kind:'estop',action:'estop'});

// Lever handle with cylinder lock and keys, red/green CLOSE-OPEN tags and the electrical hazard sticker.
const HX=-1.62,HY=2.84;
box(.24,.66,.03,chrome,HX,HY,Z0-.015,cab);
for(const dy of [-.3,.3])cyl(.12,.03,chrome,HX,HY+dy,Z0-.015,'z',cab);
box(.13,.44,.07,chrome,HX,HY+.02,Z0-.07,cab);cyl(.065,.07,chrome,HX,HY+.24,Z0-.07,'z',cab);cyl(.065,.07,chrome,HX,HY-.2,Z0-.07,'z',cab);
cyl(.045,.04,mat('#b8bec2',.9,.25),HX,HY-.26,Z0-.05,'z',cab);box(.008,.04,.01,bezelBlack,HX,HY-.26,Z0-.072,cab);
{const kg=new T.Group();kg.position.set(HX,HY-.3,Z0-.08);cab.add(kg);const ring=new T.Mesh(new T.TorusGeometry(.04,.006,6,20),chrome);ring.position.y=-.03;kg.add(ring);
 for(const [dx,rot] of [[-.02,.08],[.025,-.1]]){const k=new T.Group();k.position.set(dx,-.07,-.005);k.rotation.z=rot;kg.add(k);box(.025,.2,.008,chrome,0,-.1,0,k);const b=new T.Mesh(new T.CylinderGeometry(.035,.035,.01,20),chrome);b.rotation.x=Math.PI/2;k.add(b);}}
decal(.17,.07,200,80,(g,w,h)=>{g.fillStyle='#d32b2b';g.fillRect(0,0,w,h);g.fillStyle='#fff';ui(g,700,40);g.textAlign='center';g.textBaseline='middle';g.fillText('CLOSE',w/2,h/2+2);},HX-.09,HY+.37);
decal(.17,.07,200,80,(g,w,h)=>{g.fillStyle='#2f9b49';g.fillRect(0,0,w,h);g.fillStyle='#fff';ui(g,700,40);g.textAlign='center';g.textBaseline='middle';g.fillText('OPEN',w/2,h/2+2);},HX+.09,HY+.37);
const hazard=(g,w,h)=>{g.fillStyle='#f6c400';g.strokeStyle='#111';g.lineWidth=w*.06;g.lineJoin='round';g.beginPath();g.moveTo(w/2,h*.08);g.lineTo(w*.95,h*.9);g.lineTo(w*.05,h*.9);g.closePath();g.fill();g.stroke();
 g.fillStyle='#111';g.beginPath();g.moveTo(w*.55,h*.3);g.lineTo(w*.4,h*.6);g.lineTo(w*.52,h*.58);g.lineTo(w*.44,h*.82);g.lineTo(w*.64,h*.5);g.lineTo(w*.52,h*.52);g.closePath();g.fill();};
decal(.3,.28,256,240,hazard,HX,HY+.57);

// Stickers: enclosure plaque (bottom left), info label with QR and warning labels (bottom right).
decal(.78,.3,620,240,(g,w,h)=>{g.fillStyle='#fbfbf8';g.fillRect(0,0,w,h);g.strokeStyle='#1d1d1d';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);
 g.fillStyle='#2477a5';ui(g,700,58);g.textBaseline='middle';g.fillText('induvara',30,h/2);g.fillStyle='#1d1d1d';g.fillRect(278,30,4,h-60);
 ui(g,700,40);['INDUSTRIAL','CONTROL','ENCLOSURE'].forEach((s,i)=>g.fillText(s,300,h/2+(i-1)*48));},-1.42,1.35);
decal(.72,.34,620,290,(g,w,h)=>{g.fillStyle='#fbfbf8';g.fillRect(0,0,w,h);g.strokeStyle='#9aa0a6';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);
 g.fillStyle='#1d1d1d';ui(g,700,36);g.fillText('PLC TRAINING CENTER',24,52);ui(g,500,25);
 ['Model: FX5U-32MR/ES','Supply: 220 VAC 50 Hz','Remote I/O: CC-Link IE Field Basic','Serial: IND-ST01-2026'].forEach((s,i)=>g.fillText(s,24,100+i*38));
 const q=118,qx=w-q-28,qy=70;g.fillStyle='#fff';g.fillRect(qx,qy,q,q);g.fillStyle='#111';let sd=7;
 for(let i=0;i<14;i++)for(let j=0;j<14;j++){sd=(sd*1103515245+12345)&0x7fffffff;if(sd%3===0)g.fillRect(qx+i*q/14,qy+j*q/14,q/14,q/14);}
 for(const [a,b] of [[0,0],[10,0],[0,10]]){g.fillRect(qx+a*q/14,qy+b*q/14,q*4/14,q*4/14);g.fillStyle='#fff';g.fillRect(qx+(a+1)*q/14,qy+(b+1)*q/14,q*2/14,q*2/14);g.fillStyle='#111';}},1.42,1.95);
const warnLabel=(title,color)=>(g,w,h)=>{g.fillStyle='#fbfbf8';g.fillRect(0,0,w,h);g.fillStyle=color;g.fillRect(0,0,w,64);g.fillStyle='#111';ui(g,700,40);g.textBaseline='middle';g.fillText('⚠ '+title,16,34);
 g.save();g.translate(14,80);const s=96;g.fillStyle='#f6c400';g.beginPath();g.moveTo(s/2,4);g.lineTo(s-4,s-6);g.lineTo(4,s-6);g.closePath();g.fill();g.strokeStyle='#111';g.lineWidth=6;g.stroke();g.fillStyle='#111';ui(g,700,58);g.textAlign='center';g.fillText('!',s/2,s*.62);g.restore();
 g.textAlign='left';ui(g,500,22);['Hazardous voltage inside.','Turn off power before','opening the door.'].forEach((s,i)=>g.fillText(s,128,104+i*30));};
decal(.32,.19,400,240,warnLabel('WARNING','#f39a1e'),1.25,1.62);
decal(.32,.19,400,240,warnLabel('DANGER','#e04a2a'),1.6,1.62);
// Network and power cable to the independent cabinet.
tube([[5.2,.8,3.4],[6,.5,3.8],[7,.15,4.5],[8.5,.14,4.5],[8.7,.4,2.7]],blue,.04);
// Floor with a selectable colour (panel swatches + picker, remembered per browser); grid lines follow it.
const floorMesh=box(70,.1,70,mat('#8f9b95',.02,.8),0,-.12,0);let grid=null;
function setFloor(hex){floorMesh.material.color.set(hex);
 const c=new T.Color(hex),hsl={};c.getHSL(hsl);const line=new T.Color().setHSL(hsl.h,hsl.s,hsl.l>.5?hsl.l-.09:hsl.l+.07),fine=new T.Color().setHSL(hsl.h,hsl.s,hsl.l>.5?hsl.l-.05:hsl.l+.04);
 if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose();}
 grid=new T.GridHelper(60,60,line,fine);grid.position.y=-.059;scene.add(grid);
 document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor.toLowerCase()===hex.toLowerCase()));
 const pick=$('floor-pick');if(pick)pick.value=hex;try{localStorage.setItem('induvara-floor',hex);}catch(e){}}
{let saved=null;try{saved=localStorage.getItem('induvara-floor');}catch(e){}setFloor(/^#[0-9a-f]{6}$/i.test(saved||'')?saved:'#8f9b95');
 document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>setFloor(b.dataset.floor));$('floor-pick').oninput=e=>setFloor(e.target.value);}
const tags=[];function tag(s,pos){const el=document.createElement('div');el.className='tag';el.textContent=s;$('labels-layer').appendChild(el);tags.push({el,pos:new T.Vector3(...pos)});}
tag('FEED MAGAZINE',[0,5.4,-.1]);sensorPositions.forEach(sensor=>tag(sensor.id.toUpperCase(),[sensor.x,2.9,sensor.z]));tag('CC-Link IE · REMOTE I/O',[3.5,2.1,3]);tag('FX5U · CONTROL CABINET',[8.65,6.2,2.2]);tag('CHUTE A',[-2.1,1.3,-4.1]);tag('CHUTE B',[3,1.3,-4.1]);
const chuteSlots={yellow:[],metal:[]}, chuteCapacity=3;
const partOuterRadius=.36+.018, chutePartGap=0;
function nextChuteSlot(type){return -1.55+partOuterRadius+chuteSlots[type].length*(2*partOuterRadius+chutePartGap);}
// Workpiece plastic: deep saturated yellow so it stays yellow under ACES tone mapping.
const partYellow=new T.MeshStandardMaterial({color:'#f29d00',roughness:.55,metalness:0,envMapIntensity:.55});
const partMat={yellow:partYellow,black:rubber,metal:steel};function puck(type){const shape=new T.Shape();shape.absarc(0,0,.36,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,.065,0,Math.PI*2,true);shape.holes.push(h);const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:true,bevelSize:.018,bevelSegments:2,bevelThickness:.015,steps:1,curveSegments:32}),partMat[type]);mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;machine.add(mesh);return mesh;}
let queue=[],active=null,run=false,emergency=false,phase=0,elapsed=0,counts={yellow:0,black:0,metal:0},finished=[];const stack=[];
function updateStock(){for(const p of stack)machine.remove(p);stack.length=0;queue.slice(0,9).forEach((t,i)=>{let p=puck(t);p.position.set(0,partRestY+i*(partDepth+2*partBevel),-.15);stack.push(p);});$('stock').textContent=queue.length;}
function fill(){queue.push('yellow','black','metal','yellow','metal','black','yellow','black','metal');updateStock();}
function state(s,step){$('state').textContent=s;$('step').textContent=step;}
function act(a){if(plcMode&&a!=='reset'){const P=window.twinPLC;if(a==='start'){if(emergency){state('ปลด Emergency ด้วยปุ่ม Reset ก่อน','EMERGENCY LATCHED');return;}P.pulse('masterOn');}if(a==='stop')P.pulse('pbIn0');if(a==='estop'){Sfx.alarm();emergency=true;state('หยุดฉุกเฉิน · Input E-stop = 0 · กด Reset เพื่อปลด','EMERGENCY STOP');$('estop').style.background='#f3d2cb';}return;}
if(a==='start'){if(emergency){state('ปลด Emergency ด้วยปุ่ม Reset ก่อน','EMERGENCY LATCHED');return;}run=true;state('กำลังทำงาน','AUTOMATIC CYCLE');}if(a==='stop'){run=false;state('หยุดชั่วคราว','CYCLE PAUSED');}if(a==='estop'){Sfx.alarm();run=false;emergency=true;state('หยุดฉุกเฉิน · กด Reset เพื่อปลด','EMERGENCY STOP');$('estop').style.background='#f3d2cb';}if(a==='reset'){run=false;emergency=false;phase=0;elapsed=0;if(active)machine.remove(active.mesh);active=null;for(const p of finished)machine.remove(p);finished=[];chuteSlots.yellow.length=0;chuteSlots.metal.length=0;queue=[];counts={yellow:0,black:0,metal:0};for(const a of actuators)a.position.z=0;clearPlcParts();fill();$('estop').style.background='';state(plcMode?'ควบคุมโดย PLC · กดเริ่มทำงาน (X0) เพื่อสั่ง Auto':'พร้อมทำงาน',plcMode?'PLC ONLINE':'SYSTEM READY');}}
for(let a of ['start','stop','estop','reset'])$(a).onclick=()=>act(a);$('refill').onclick=fill;document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{queue.push(b.dataset.part);updateStock();});fill();
const ray=new T.Raycaster(),mouse=new T.Vector2();let down=null;let heldSig=null;function pickClickable(e){let r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(clickables);return hit.length?hit[0].object:null;}
let held=null;renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];const o=pickClickable(e);if(!o)return;Sfx.click();const d=o.userData;if(d.kind==='selector'){d.on=!d.on;d.visual(d.on);if(plcMode&&d.sig)window.twinPLC.press(d.sig,d.on);return;}if(d.kind!=='push')return;held=d;d.visual(true);orbit.enabled=false;if(plcMode&&d.sig){heldSig=d.sig;window.twinPLC.press(d.sig,true);}});
const releaseHeld=()=>{if(held){held.visual(false);held=null;orbit.enabled=true;}if(!heldSig)return;window.twinPLC.press(heldSig,false);heldSig=null;};
window.addEventListener('pointerup',releaseHeld);window.addEventListener('blur',releaseHeld);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;let r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(clickables);if(hit.length){const d=hit[0].object.userData;if(d.kind==='selector'||(plcMode&&d.sig)||!d.action)return;act(d.action);}});
const views={all:[[-13,15.2,-13.3],[-2.4,1,.9]],station:[[0,15,-19],[0,1.3,0]],cabinet:[[-12,7,-9],[-8.65,3,2.2]],top:[[0,23,-.21],[0,.8,-.2]]};let camTween=null;const spinBtn=$('spin');orbit.autoRotateSpeed=-1.1;function setSpin(on){orbit.autoRotate=on;spinBtn.classList.toggle('on',on);spinBtn.setAttribute('aria-pressed',String(on));spinBtn.querySelector('span').textContent=on?'หยุดหมุน':'หมุนอัตโนมัติ';}
spinBtn.onclick=()=>{camTween=null;setSpin(!orbit.autoRotate);};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{setSpin(false);document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n===b));const v=views[b.dataset.view];camTween={from:camera.position.clone(),targetFrom:orbit.target.clone(),to:new T.Vector3(...v[0]),target:new T.Vector3(...v[1]),t:0};});
// Shift the picture left only while the side panel covers the right edge; centred when it is collapsed.
function resize(){const w=vp.clientWidth,h=vp.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const panelOpen=!$('control-panel').hidden;if(w>760&&panelOpen)camera.setViewOffset(w,h,140,0,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
new MutationObserver(resize).observe($('control-panel'),{attributes:true,attributeFilter:['hidden']});$('loading').remove();
function sensors(values){sensorOrder.forEach(id=>{const v=!!values[id];$('s-'+id).classList.toggle('on',v);$('v-'+id).textContent=v?'ON':'OFF';sensorLEDs[id].material.emissive=new T.Color(v?'#00eb83':'#000000');sensorLEDs[id].material.emissiveIntensity=v?2:0;if(ccInputLEDs[id])ccInputLEDs[id].material.emissiveIntensity=v?1.8:0;});}
// ---------- PLC-driven physics: Y outputs move the machine, the machine produces X inputs ----------
let plcMode=false;
const plc={ext:[0,0,0],parts:[],feedArmed:true};
const pushX=[-2.1,3], chuteKey=['yellow','metal'], BELT_SPEED=1.75;
function clearPlcParts(){for(const p of plc.parts)machine.remove(p.mesh);plc.parts=[];plc.ext=[0,0,0];plc.feedArmed=true;for(const b of bodies)machine.remove(b.mesh);bodies.length=0;restingParts.length=0;}
function placeOnChute(mesh,slotZ,v){const stopZ=chuteCenterZ+slotZ*Math.cos(chuteAngle)+(.045/2+partBevel)*Math.sin(chuteAngle);mesh.position.z=T.MathUtils.lerp(-1.75,stopZ,v);const entryZ=chuteCenterZ+.8*Math.cos(chuteAngle);const onChute=mesh.position.z<=entryZ;const surfaceY=chuteCenterY-Math.tan(chuteAngle)*(mesh.position.z-chuteCenterZ)+(.045/2+partBevel)/Math.cos(chuteAngle);mesh.position.y=onChute?surfaceY:T.MathUtils.lerp(partRestY,chuteCenterY-.8*Math.sin(chuteAngle)+(.045/2+partBevel)/Math.cos(chuteAngle),(-1.75-mesh.position.z)/(-1.75-entryZ));mesh.rotation.x=-Math.PI/2+(onChute?chuteAngle:0);}
function toChute(p,i){placeOnChute(p.mesh,p.slotZ,1);p.state='chute';chuteSlots[chuteKey[i]].push(p.mesh);counts[chuteKey[i]]++;finished.push(p.mesh);}
function plcStep(dt){
 const P=window.twinPLC,O=s=>P.output(s);
 const motor=O('motor'),rev=O('motorRev');
 // Cylinders: single solenoid, spring return. Feed stroke 0.9 s, sort pushers 0.42 s.
 const want=[O('solA'),O('solB'),O('solFeed')],rate=[1/.42,1/.42,1/.9];
 for(let i=0;i<3;i++){const d=(want[i]?1:0)-plc.ext[i];plc.ext[i]+=Math.sign(d)*Math.min(Math.abs(d),rate[i]*dt);}
 actuators[0].position.z=-plc.ext[0]*1.15;actuators[1].position.z=-plc.ext[1]*1.15;actuators[2].position.z=-plc.ext[2]*FEED_STROKE;
 // Feed: the bottom part drops in front of the pusher only while it is retracted.
 if(plc.ext[2]<.04)plc.feedArmed=true;
 let feeding=plc.parts.find(p=>p.state==='feed');
 if(!feeding&&plc.feedArmed&&plc.ext[2]>.04&&queue.length){const type=queue.shift();feeding={type,mesh:puck(type),state:'feed',f:0,x:0,push:0};plc.parts.push(feeding);plc.feedArmed=false;updateStock();}
 if(feeding){feeding.f=Math.max(feeding.f,plc.ext[2]);feeding.mesh.position.set(0,partRestY,feedPartZ(feeding.f));if(feeding.f>=.995){feeding.state='belt';feeding.x=0;}}
 // Conveyor: Y motor runs it, Y motorRev reverses it (toward chute A).
 const v=motor?(rev?-BELT_SPEED:BELT_SPEED):0;
 beltMove(v,dt);
 for(const p of plc.parts){
  if(p.state==='belt'){p.x+=v*dt;p.mesh.position.set(p.x,partRestY,-1.75);p.mesh.rotation.x=-Math.PI/2;if(Math.abs(p.x)>5.55){p.state='done';startDrop(p.mesh,v);counts.black++;finished.push(p.mesh);if(finished.length>24)machine.remove(finished.shift());}}
  else if(p.state==='fall'){p.fallT=Math.min(1,p.fallT+dt/.4);p.mesh.position.x=p.edge+p.dir*p.fallT*.7;p.mesh.position.y=partRestY-p.fallT*.75;if(p.fallT>=1){p.state='done';counts.black++;finished.push(p.mesh);if(finished.length>24)machine.remove(finished.shift());}}
 }
 // Sort pushers capture a part lined up with them (±0.45) as they start to extend.
 for(let i=0;i<2;i++){
  const e=plc.ext[i];
  if(e>.06&&e<.5&&!plc.parts.some(p=>p.state==='push'&&p.chute===i)){const p=plc.parts.find(q=>q.state==='belt'&&Math.abs(q.x-pushX[i])<.5);if(p){p.state='push';p.chute=i;p.zp=-1.75;p.x=pushX[i];p.slotZ=chuteSlots[chuteKey[i]].length<chuteCapacity?nextChuteSlot(chuteKey[i]):null;}}
  for(const p of plc.parts){if(p.state!=='push'||p.chute!==i)continue;
   p.mesh.position.x=pushX[i];
   const stopZ=p.slotZ===null?chuteEntryZ+.06:chuteStopZ(p.slotZ);           // chute full: stuck at its lip
   p.zp=pushPart(p.zp,e,stopZ,dt);if(p.slotZ===null)p.zp=Math.max(p.zp,chuteEntryZ+.06);
   posePart(p.mesh,p.zp);
   if(p.slotZ!==null&&p.zp<=stopZ+1e-4)toChute(p,i);
   else if(e<.05&&p.zp>-1.75-.05){p.state='belt';p.mesh.position.set(p.x,partRestY,-1.75);p.mesh.rotation.x=-Math.PI/2;}
  }
 }
 plc.parts=plc.parts.filter(p=>p.state!=='done'&&p.state!=='chute');
 // Sensors from part positions (simulate) or straight from the PLC's X (monitor).
 const phys={photo:false,cap:false,ind:false},nearby=[];let seen=null;
 for(const p of plc.parts){if(p.state==='fall')continue;for(const sensor of sensorPositions)if(sensorOverlap(p.mesh.position,sensor)){phys[sensor.id]=phys[sensor.id]||materialSignals[p.type][sensor.id];if(!nearby.includes(sensor.id.toUpperCase()))nearby.push(sensor.id.toUpperCase());seen=p;}}
 const monitor=P.access==='read';
 const shown=monitor?{photo:P.input('photo'),cap:P.input('cap'),ind:P.input('ind')}:phys;
 sensors(shown);
 const ex=plc.ext;
 const inputs={...phys,feedRet:ex[2]<.03,feedExt:ex[2]>.97,aRet:ex[0]<.03,aExt:ex[0]>.97,bRet:ex[1]<.03,bExt:ex[1]>.97,magEmpty:queue.length===0,estopOk:!emergency,masterOn:false,controlPower:false};
 P.setInputs(inputs);
 // Lamps follow the PLC outputs.
 pilot.forEach((l,i)=>{l.material.emissiveIntensity=(i<6?O('lamp'+i):O('controlOn'))?1.5:.03;});
 $('sensor-material').textContent=monitor?'Monitor: เซนเซอร์แสดงค่า X จาก PLC':(nearby.length&&seen?'ผ่าน '+nearby.join(' / ')+' · '+materialSignals[seen.type].name:'รอชิ้นงานผ่านเซนเซอร์');
 Object.keys(counts).forEach(k=>$('c-'+k).textContent=counts[k]);
 if(!emergency){const parts=[motor?(rev?'สายพานถอยหลัง':'สายพานเดินหน้า'):'สายพานหยุด'];if(want[2])parts.push('ป้อนชิ้นงาน');if(want[0])parts.push('ดันราง A');if(want[1])parts.push('ดันราง B');state('ควบคุมโดย PLC · '+parts.join(' · '),'PLC '+(O('lamp0')?'RUN':'ONLINE')+(monitor?' · MONITOR':''));}
 window.twinIO={...inputs,...(monitor?shown:{}),motor,motorRev:rev,solFeed:want[2],solA:want[0],solB:want[1],controlOn:O('controlOn'),...Object.fromEntries([0,1,2,3,4,5].map(i=>['lamp'+i,O('lamp'+i)]))};
}

// ---------- Sound (Web Audio, synthesized — no files). Off by default; toggled from the view bar. ----------
const Sfx=(()=>{let ctx=null,master=null,humGain=null,noiseBuf=null,on=false;
 function init(){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // Gear-motor hum: low sawtooth through a low-pass, its 2nd harmonic, and a little gear/belt noise.
  humGain=ctx.createGain();humGain.gain.value=0;humGain.connect(master);
  const mix=ctx.createGain();mix.gain.value=.16;mix.connect(humGain);
  const o1=ctx.createOscillator();o1.type='sawtooth';o1.frequency.value=96;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;o1.connect(lp);lp.connect(mix);
  const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=192;const g2=ctx.createGain();g2.gain.value=.4;o2.connect(g2);g2.connect(mix);
  const n=ctx.createBufferSource();n.buffer=noiseBuf;n.loop=true;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.6;const ng=ctx.createGain();ng.gain.value=.22;n.connect(bp);bp.connect(ng);ng.connect(mix);
  o1.start();o2.start();n.start();}
 const t=()=>ctx.currentTime;
 function env(g,vol,a,dur){g.gain.setValueAtTime(0,t());g.gain.linearRampToValueAtTime(vol,t()+a);g.gain.exponentialRampToValueAtTime(.0001,t()+dur);}
 function noise(dur,freq,q,vol,a=.004,type='bandpass'){if(!on||!ctx)return;const s=ctx.createBufferSource();s.buffer=noiseBuf;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();env(g,vol,a,dur);s.connect(f);f.connect(g);g.connect(master);s.start(t(),Math.random()*.5,dur+.05);}
 function tone(freq,dur,vol,type='triangle',to=null,a=.003){if(!on||!ctx)return;const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t());if(to)o.frequency.exponentialRampToValueAtTime(to,t()+dur);const g=ctx.createGain();env(g,vol,a,dur);o.connect(g);g.connect(master);o.start();o.stop(t()+dur+.05);}
 return{
  get on(){return on;},
  setOn(v){on=v;if(v){if(!ctx)init();ctx.resume();}else if(ctx){humGain.gain.setValueAtTime(0,t());ctx.suspend();}},
  belt(running){if(!on||!ctx)return;humGain.gain.setTargetAtTime(running?1:0,t(),.09);},
  hiss(){noise(.32,2900,.7,.22,.01);noise(.18,5200,1.2,.08,.005);},             // valve exhaust / air into the cylinder
  clack(){tone(150,.07,.32,'triangle',90);noise(.035,3400,1.4,.18,.001);},        // piston reaching its end stop
  impact(speed){const v=Math.min(1,speed/7);tone(260+Math.random()*120,.05+.04*v,.12+.33*v,'triangle',140);noise(.04+.03*v,1500+Math.random()*900,1.1,.08+.28*v,.001);},
  click(){tone(2100,.018,.1,'square');tone(900,.03,.06,'triangle');},
  alarm(){if(!on||!ctx)return;for(let k=0;k<3;k++)setTimeout(()=>{tone(880,.16,.16,'square');setTimeout(()=>tone(660,.16,.16,'square'),180);},k*380);}
 };})();
let beltLastT=0;const cylPrev=[0,0,0],cylMoving=[false,false,false];
function reedTick(){reedLEDs.forEach((l,i)=>{const a=actuators[i];if(!a)return;const stroke=i===2?FEED_STROKE:SORT_STROKE,e=-a.position.z/stroke;
 l.ret.emissiveIntensity=e<.03?2.2:0;l.ext.emissiveIntensity=e>.97?2.2:0;});}
function soundTick(){if(!Sfx.on)return;
 Sfx.belt(performance.now()-beltLastT<120);
 for(let i=0;i<3;i++){const z=actuators[i].position.z,moving=Math.abs(z-cylPrev[i])>2e-4;if(moving&&!cylMoving[i])Sfx.hiss();if(!moving&&cylMoving[i])Sfx.clack();cylMoving[i]=moving;cylPrev[i]=z;}}
{const btn=$('sound');let pref=false;try{pref=localStorage.getItem('induvara-sound')==='1';}catch(e){}
 const paint=()=>{btn.classList.toggle('on',Sfx.on);btn.setAttribute('aria-pressed',String(Sfx.on));btn.querySelector('span').textContent=Sfx.on?'เสียง: เปิด':'เสียง: ปิด';btn.querySelector('.wave').style.display=Sfx.on?'':'none';btn.querySelector('.mute').style.display=Sfx.on?'none':'';};
 btn.onclick=()=>{Sfx.setOn(!Sfx.on);try{localStorage.setItem('induvara-sound',Sfx.on?'1':'0');}catch(e){}if(Sfx.on)Sfx.click();paint();};
 // Browsers only start audio after a user gesture: a saved "on" resumes on the first click anywhere.
 if(pref)window.addEventListener('pointerdown',()=>{if(!Sfx.on){Sfx.setOn(true);paint();}},{once:true});
 document.addEventListener('pointerdown',e=>{if(e.target.closest('button')&&e.target.closest('button')!==btn)Sfx.click();});
 paint();}
let prev=performance.now();function loop(now){requestAnimationFrame(loop);soundTick();reedTick();let raw=Math.min((now-prev)/1000,.05);prev=now;let dt=raw*Number($('speed').value);
{const on=!!(window.twinPLC&&window.twinPLC.connected);if(on!==plcMode){plcMode=on;$('speed').disabled=on;act('reset');if(on)for(const o of clickables){const d=o.userData;if(d.kind==='selector'&&d.on&&d.sig)window.twinPLC.press(d.sig,true);}}}
if(camTween){let c=camTween;c.t=Math.min(1,c.t+raw*1.6);let v=c.t*c.t*(3-2*c.t);camera.position.lerpVectors(c.from,c.to,v);orbit.target.lerpVectors(c.targetFrom,c.target,v);if(c.t===1)camTween=null;}
if(!plcMode&&run){elapsed+=dt;if(!active){if(queue.length && queue[0]!=='black' && chuteSlots[queue[0]].length>=chuteCapacity){run=false;state('ราง '+(queue[0]==='yellow'?'A':'B')+' เต็ม 3 ชิ้น · กด Reset เพื่อเริ่มใหม่','CHUTE FULL');}else if(queue.length){const type=queue.shift();active={type,mesh:puck(type),x:0,slotZ:type==='black'?null:nextChuteSlot(type)};active.mesh.position.set(0,partRestY,-.15);phase=0;elapsed=0;updateStock();state('ป้อนชิ้นงานจากแมกกาซีน','01 · FEEDING');}else {run=false;state('ชิ้นงานหมด · เติมเพื่อเริ่มรอบใหม่','MAGAZINE EMPTY');}}
if(active){let p=active.mesh,t=active.type;if(phase===0){let v=Math.min(elapsed/.9,1);actuators[2].position.z=-v*FEED_STROKE;p.position.z=feedPartZ(v);if(v===1){phase=1;elapsed=0;state('ตรวจสอบชิ้นงาน','02 · SENSOR DETECTION');}}else if(phase===1){actuators[2].position.z=Math.min(0,actuators[2].position.z+dt*2);if(elapsed>.75){phase=2;elapsed=0;state('ลำเลียงไปยังช่องรับ','03 · CONVEYING');}}else if(phase===2){let dir=t==='yellow'?-1:1;active.x+=dir*dt*1.75;beltMove(dir*1.75,dt);p.position.x=active.x;const target=t==='black'?5.55:(t==='yellow'?2.1:3);if(Math.abs(active.x)>=target){phase=3;elapsed=0;state(t==='black'?'ส่งออกปลายสายพาน':'กระบอกลมคัดแยกชิ้นงาน','04 · SORTING');}}else if(phase===3){let v=Math.min(elapsed/.85,1);if(t==='black'){beltMove(1.75,dt);if(!active.dropped){active.dropped=true;startDrop(p,1.75);}}else{const idx=t==='yellow'?0:1;const e=Math.sin(v*Math.PI);actuators[idx].position.z=-e*SORT_STROKE;p.position.x=t==='yellow'?-2.1:3;const stopZ=chuteStopZ(active.slotZ);if(active.zp===undefined)active.zp=-1.75;active.zp=pushPart(active.zp,e,stopZ,dt);if(v===1)active.zp=stopZ;posePart(p,active.zp);}if(v===1){counts[t]++;if(t!=='black')chuteSlots[t].push(p);finished.push(p);if(finished.length>18)machine.remove(finished.shift());active=null;elapsed=0;for(const a of actuators)a.position.z=0;}}}}
updateDrops(plcMode?raw:dt);if(plcMode)plcStep(raw);else{const signal=active?materialSignals[active.type]:null;
const readings={photo:false,cap:false,ind:false};const nearby=[];
for(const sensor of sensorPositions){if(active&&sensorOverlap(active.mesh.position,sensor)){nearby.push(sensor.id.toUpperCase());readings[sensor.id]=signal[sensor.id];}}
sensors(readings);
$('sensor-material').textContent=nearby.length?'ผ่าน '+nearby.join(' / ')+' · '+signal.name:'รอชิ้นงานผ่านเซนเซอร์';Object.keys(counts).forEach(k=>$('c-'+k).textContent=counts[k]);pilot.forEach((p,i)=>{p.material.emissiveIntensity=i===6?(emergency?0:1):((i===0&&run)||(i===1&&phase===0&&run)||(i===2&&phase===3&&run)||(i===3&&!run)||(i>=4&&emergency)?1.5:.03);});
// Publish simulated signal states for the I/O table (io.js).
{const z=i=>actuators[i].position.z,lit=i=>pilot[i]&&pilot[i].material.emissiveIntensity>.5;window.twinIO={...readings,masterOn:false,controlPower:false,estopOk:!emergency,lamp0:lit(0),lamp1:lit(1),lamp2:lit(2),lamp3:lit(3),lamp4:lit(4),lamp5:lit(5),controlOn:lit(6),feedRet:z(2)>-.05,feedExt:z(2)<-.8,aRet:z(0)>-.05,aExt:z(0)<-1.05,bRet:z(1)>-.05,bExt:z(1)<-1.05,magEmpty:queue.length===0,motor:run,solFeed:!!(run&&active&&phase===0),solA:!!(run&&active&&phase===3&&active.type==='yellow'),solB:!!(run&&active&&phase===3&&active.type==='metal')};}}
orbit.update();const w=vp.clientWidth,h=vp.clientHeight;tags.forEach(t=>{const p=machine.localToWorld(t.pos.clone()).project(camera);t.el.style.display=$('labels').checked&&p.z<1&&p.x<.9&&p.x>-.95?'block':'none';t.el.style.left=(p.x*.5+.5)*w+'px';t.el.style.top=(-p.y*.5+.5)*h+'px';});renderer.render(scene,camera);}
requestAnimationFrame(loop);
