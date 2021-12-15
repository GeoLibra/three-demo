/* eslint-disable */
import React, { useEffect, useCallback } from "react";
import { BufferGeometry, Scene, Mesh, Line, Color, Object3D, Shape, LineBasicMaterial, Vector3, ExtrudeGeometry, MeshBasicMaterial, PerspectiveCamera, WebGLRenderer, DirectionalLight, AxesHelper, GridHelper, CubicBezierCurve3, ShaderMaterial, Points, Ray, SphereGeometry, MeshPhongMaterial, Group } from "three";
import * as d3geo from "d3-geo";
import Orbitcontrols from "three-orbitcontrols";
import mapJson from "./map.json";
import "./index.css";
export const Map = () => {
  const posArr = [{ "x": 0.5738958419746141, "y": -0.44114968930852216, "z": 4.9473255920938985 }, { "x": -0.9326350073394328, "y": 2.8399222968004114, "z": -4.00812091773949 }, { "x": 3.469198597393574, "y": 1.2295167303380952, "z": -3.3842206934036057 }, { "x": -2.4019084876611916, "y": -2.190220428765315, "z": 3.7991801866087123 }, { "x": -2.49363689878109, "y": -4.099696049856375, "z": 1.4050862307450966 }, { "x": -2.3729307780326305, "y": 2.840227787960863, "z": 3.3618901878497454 }, { "x": -2.0636200279017873, "y": 0.7444294629976027, "z": -4.493027615657812 }, { "x": 0.47725894517680106, "y": 2.4327372143508037, "z": -4.34212085796347 }, { "x": -2.4777001955161246, "y": -1.2092952460724242, "z": 4.171163716394502 }, { "x": -0.03915748918627658, "y": -0.008362945319338826, "z": 4.999839672648135 }, { "x": 1.5223738738260317, "y": -1.032865814102439, "z": -4.649254348640267 }, { "x": -0.26640112020426315, "y": -4.314854187280748, "z": 2.5121830716848077 }, { "x": -4.031470206741836, "y": -2.606648761952297, "z": -1.3973654511134501 }, { "x": 0.8544382232162094, "y": 1.5274953155132989, "z": 4.683662390031124 }, { "x": 3.0409624989238546, "y": 1.76433738825175, "z": -3.555230043268055 }, { "x": -4.721251023266457, "y": 1.2354922989397954, "z": -1.0878177947459262 }, { "x": 2.1518961827021106, "y": 3.891904027152385, "z": -2.285262755638206 }, { "x": 0.8501960736517479, "y": -2.851729208821255, "z": -4.018060123480341 }, { "x": 2.5631840141785176, "y": 4.263234820997851, "z": -0.5048926326370041 }, { "x": -0.4580143454812531, "y": -2.6523265200067385, "z": 4.213714144386437 }];
  let map, scene, camera, renderer, pointsGroup = new Group(), flylinegroup = new Group();
  const radius = 5;
  const initMap = useCallback(() => {
    const prj = d3geo
      .geoMercator()
      .center([120.197, 30.29])
      .scale(80)
      .translate([0, 0]);
    mapJson.features.forEach((ele) => {
      const province = new Object3D();
      const coord = ele.geometry.coordinates;
      coord.forEach((multiPlg) => {
        multiPlg.forEach((plg) => {
          const shape = new Shape();
          const lineMaterial = new LineBasicMaterial({ color: 0xffffff });
          const lineGeometry = new BufferGeometry();
          for (let i = 0; i < plg.length; i++) {
            const [x, y] = prj(plg[i]);

            if (i === 0) {
              shape.moveTo(x, -y);
            }

            shape.lineTo(x, -y);
            lineGeometry.setFromPoints(new Vector3(x, -y, 4.01));
          }

          const extrudeSetting = {
            depth: 4,
            bevelEnabled: false,
          };
          const geometry = new ExtrudeGeometry(shape, extrudeSetting);
          const material = new MeshBasicMaterial({
            color: "#25b864",
            transparent: true,
            opacity: 0.6,
          });
          const mesh = new Mesh(geometry, material);
          province.add(mesh);
          const line = new Line(lineGeometry, lineMaterial);
          province.add(line);
        });
      });

      province.properties = ele.properties;
      if (ele.properties.centroid) {
        const [x, y] = prj(ele.properties.centroid);
        province.properties._centroid = [x, y];
      }
      map.add(province);
    });
    scene.add(map);
  }, [map, scene])

  const initThree = useCallback(() => {
    scene = new Scene();
    // 设置场景背景色
    scene.background = new Color(0xf0f0f0);
    map = new Object3D();

    const fov = 35;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 10000;
    // 相机
    camera = new PerspectiveCamera(fov, aspect, near, far);
    // 设置摄像机的位置
    camera.position.set(0, -70, 90);
    camera.lookAt(0, 0, 0);

    const canvas = document.querySelector("#map");
    renderer = new WebGLRenderer({
      alpha: true,
      canvas,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight - 10);

    // 添加灯光
    const color = 0xffffff;
    const intensity = 1;
    const light = new DirectionalLight(color, intensity);
    light.position.set(300, 1000, 500);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
    scene.add(light);

    //网格和坐标
    const axesHelper = new AxesHelper(2000);
    // scene.add(axesHelper);
    const gridHelper = new GridHelper(600, 60);
    // scene.add(gridHelper);
    const controls = new Orbitcontrols(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.35;
  }, [])

  const displayLabel = useCallback(() => {
    let canvas = document.querySelector("#name");
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    // 创建离屏canvas
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const ctxOffCanvas = canvas.getContext("2d");
    ctxOffCanvas.font = "16px Arial";
    ctxOffCanvas.strokeStyle = "#FFFFFF";
    ctxOffCanvas.fillStyle = "#000000";
    // names用来存储名称,重叠的部分不放在里面
    const names = [];
    map.children.forEach((ele, index) => {
      if (!ele.properties._centroid) {
        return;
      }
      const x = ele.properties._centroid[0];
      const y = -ele.properties._centroid[1];
      const z = 4;
      const vector = new Vector3(x, y, z);
      const position = vector.project(camera);
      const name = ele.properties.name;
      const left = ((vector.x + 1) / 2) * width;
      const top = (-(vector.y - 1) / 2) * height;
      const text = {
        name,
        left,
        top,
        width: ctxOffCanvas.measureText(name).width,
        height: 16,
      };

      let show = true;
      for (let i = 0; i < names.length; i++) {
        if (
          text.left + text.width < names[i].left ||
          text.top + text.height < names[i].top ||
          names[i].left + names[i].width < text.left ||
          names[i].top + names[i].height < text.top
        ) {
          show = true;
        } else {
          show = false;
          break;
        }
      }
      if (show) {
        names.push(text);
        ctxOffCanvas.strokeText(name, left, top);
        ctxOffCanvas.fillText(name, left, top);
      }
    });
    ctx.drawImage(offCanvas, 0, 0);
  }, []);

  const onWindowResize = useCallback(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / window.innerHeight);
  }, [camera, renderer]);

  const createMaterial = () => {
    const vertexShader = `
      uniform float time;
      uniform float size;
      varying vec3 iPosition;

      void main(){
        iPosition=vec3(position);
        float end=time+size;
        float pointsize=1.;
        if(position.x>time && position.x<end){
          pointsize=(position.x-time)/size;
        }
        gl_PointSize=pointsize*2.;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `;
    const fragmentShader = `
      uniform float time;
      uniform float size;
      varying vec3 iPosition;

      void main(){
        float end=time+size;
        vec4 color;
        if(iPosition.x>end||iPosition.x<time){
          discard;
        }else if(iPosition.x>time&&iPosition.x<end){
          float ca=fract((iPosition.x-time)/size);
          color=vec4(ca/1.9,ca,ca/1.6,1.);
        }

        float d=distance(gl_PointCoord,vec2(.5,.5));
        if(abs(iPosition.x-end)<.2||abs(iPosition.x-time)<.2){
          if(d>.1){
            discard;
          }
        }
        gl_FragColor=color;
      }
    `;
    // 配置着色器里的attribute变量
    const attribute = {};
    const uniforms = {
      time: {
        type: 'f',
        value: -70.0
      },
      size: { type: 'f', value: 20.0 }
    };

    const meshMaterial = new ShaderMaterial({
      uniforms,
      defaultAttributeValues: attribute,
      vertexShader,
      fragmentShader,
      transparent: true
    });
    return meshMaterial;
  }

  // 计算v1,v2 的中点
  const getVCenter = (v1, v2) => {
    let v = v1.add(v2);
    return v.divideScalar(2);
  }

  // 计算V1，V2向量固定长度的点
  const getLenVcetor = (v1, v2, len) => {
    let v1v2Len = v1.distanceTo(v2);
    return v1.lerp(v2, len / v1v2Len);
  }

  const addFlyLine = useCallback((v0, v3) => {
    const angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1; // 0 ~ Math.PI
    const aLen = angle * 0.4,
      hLen = angle * angle * 12,
      p0 = new Vector3(0, 0, 0);

    const rayLine = new Ray(p0, getVCenter(v0.clone(), v3.clone()));
    let flyline;
    // 顶点坐标
    const vtop = rayLine.at(hLen / rayLine.at(1).distanceTo(p0));

    // 控制点坐标
    const v1 = getLenVcetor(v0.clone(), vtop, aLen);
    const v2 = getLenVcetor(v3.clone(), vtop, aLen);

    const curve = new CubicBezierCurve3(v0, v1, v2, v3);
    const points = curve.getPoints(50);
    const geometry = new BufferGeometry().setFromPoints(points);
    geometry.colors = curve.getPoints(50).map((item, index) => index > 25 ? new Color(0xFAE161) : new Color(0xFF0000))
    const material = createMaterial();
    flyline = new Points(geometry, material);
    flylinegroup.add(flyline);
  }, [scene])


  // 动画循环
  const loop = useCallback(() => {
    displayLabel()
    render()
    requestAnimationFrame(loop)
  }, [])
  // 渲染画布
  const render = useCallback(() => {
    renderer.render(scene, camera);
  }, [])

  const onMouseMove = (event) => {
    event.preventDefault();
  }
  const randomPoint = useCallback((group, radius) => {
    const arr = posArr.map(pos => {
      const dotGeo = new SphereGeometry(0.1, 0.2, 0.2);
      const dotMater = new MeshPhongMaterial({ color: 'tomato' });
      const dotMesh = new Mesh(dotGeo, dotMater);
      // const pos = getPos(radius, Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
      dotMesh.position.set(pos.x, pos.y, pos.z);
      group.add(dotMesh);
    })
  }, [])
  useEffect(() => {
    initThree();
    initMap();
    displayLabel();
    render();

    randomPoint(pointsGroup, radius);
    scene.add(pointsGroup);
    pointsGroup.children.forEach((item) => {
      addFlyLine(pointsGroup.children[0].position, item.position);
    });
    scene.add(flylinegroup);

    loop();
    document.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("resize", onWindowResize, false);
  }, []);
  return (
    <div className="container">
      <canvas id="map"></canvas>
      <canvas id="name"></canvas>
    </div>
  );
}
