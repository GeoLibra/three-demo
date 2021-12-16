/* eslint-disable */
import React, { useEffect, useCallback } from "react";
import { BufferGeometry, Scene, Mesh, Line, Color, Object3D, Shape, LineBasicMaterial, Vector3, ExtrudeGeometry, MeshBasicMaterial, PerspectiveCamera, WebGLRenderer, DirectionalLight, AxesHelper, GridHelper, CubicBezierCurve3, ShaderMaterial, Points, Ray, SphereGeometry, MeshPhongMaterial, Group, CatmullRomCurve3 } from "three";
import * as d3geo from "d3-geo";
import Orbitcontrols from "three-orbitcontrols";
import { FlyLine } from './flyline';
import { FlyByMeshLine } from './meshline';
import { PointsFlyLine } from './PointsFlyLine';
import mapJson from "./map.json";
import TWEEN from '@tweenjs/tween.js';
import "./index.css";
export const Map = () => {
  let map, scene, camera, renderer, pointsGroup = new Group(), linegroup = new Group();
  const flyLine = new FlyLine();
  const flyByMeshLine = new FlyByMeshLine();

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


  // 动画循环
  const loop = useCallback(() => {
    displayLabel()
    render()
    requestAnimationFrame(loop)
  }, [])

  const randomNum = (minNum, maxNum) => {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
  }

  // 🌰
  const flyByPoint = () => {
    for (let j = 0; j < 20; j++) {
      const start = randomNum(-30, -70) / 10;
      const end = randomNum(700, 3000) / 10;
      const fr = randomNum(100, 1000) / 1000;
      const fg = randomNum(100, 1000) / 1000;
      const fb = randomNum(100, 1000) / 1000;
      const tr = randomNum(100, 1000) / 1000;
      const tg = randomNum(100, 1000) / 1000;
      const tb = randomNum(100, 1000) / 1000;
      const line = flyLine.addflyline(start, end, { r: fr, g: fg, b: fb }, { r: tr, g: tg, b: tb });
      linegroup.add(line);
    }

    if (linegroup.length) {
      for (let i = 0; i < linegroup.length; i++) {
        const flyline = linegroup[i];
        if (flyline && flyline.material.uniforms) {
          const time = flyline.material.uniforms.time.value;
          const size = flyline.material.uniforms.size.value;
          if (time > flyline.maxx) {
            flyline.material.uniforms.time.value = flyline.minx - size;
          }
          flyline.material.uniforms.time.value += 1.0;
        }
      }
    }
    scene.add(linegroup);
  }
  // Setup the animation loop.
  const animate = (time) => {
    requestAnimationFrame(animate)
    TWEEN.update(time)
  }

  // 渲染画布
  const render = useCallback(() => {
    const startPoint = {
      x: 0,
      y: 0,
      z: 0
    }
    const endPoint = {
      x: -40,
      y: 20,
      z: 0
    }
    const heightLimit = 20
    const flyTime = 10000
    const lineStyle = {
      color: 0xcc0000,
      linewidth: 2
    }
    const aCurve = flyByMeshLine.createFlyLine(startPoint, endPoint, heightLimit, flyTime, lineStyle)
    const tween = new TWEEN.Tween({ endPointIndex: 1 })
      .to({ endPointIndex: 50 }, flyTime)
      .onUpdate(({ endPointIndex }) => {
        const curvePartialData = new CatmullRomCurve3(flyByMeshLine.curveModelData.slice(0, Math.ceil(endPointIndex)))
        aCurve.geometry.setFromPoints(curvePartialData.getPoints(50));
        renderer.render(scene, camera);
      }).start();
    scene.add(aCurve);
    requestAnimationFrame(animate)
    // renderer.render(scene, camera);
  }, [])

  const onMouseMove = (event) => {
    event.preventDefault();
  }

  useEffect(() => {
    initThree();
    initMap();
    // displayLabel();
    render();
    // loop();
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
