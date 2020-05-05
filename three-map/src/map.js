import React, { Component } from "react";
import * as THREE from "three";
import * as d3geo from 'd3-geo';
import Orbitcontrols from 'three-orbitcontrols';
import mapJson from "./map.json";

export default class Map extends Component {
  initMap() {
    const prj = d3geo
      .geoMercator()
      .center([120.197, 30.29])
      .scale(80)
      .translate([0, 0]);
    mapJson.features.forEach((ele) => {
      const province = new THREE.Object3D();
      const coord = ele.geometry.coordinates;
      coord.forEach((multiPlg) => {
        multiPlg.forEach((plg) => {
          const shape = new THREE.Shape();
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const lineGeometry = new THREE.Geometry();
          for (let i = 0; i < plg.length; i++) {
            const [x, y] = prj(plg[i]);

            if (i === 0) {
              shape.moveTo(x, -y);
            }

            shape.lineTo(x, -y);
            lineGeometry.vertices.push(new THREE.Vector3(x, -y, 4.01));
          }

          const extrudeSetting = {
            depth: 4,
            bevelEnabled: false,
          };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSetting);
          const material = new THREE.MeshBasicMaterial({
            color: "#25b864",
            transparent: true,
            opacity: 0.6,
          });
          const mesh = new THREE.Mesh(geometry, material);
          province.add(mesh);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          province.add(line);
        });
      });

      province.properties = ele.properties;
      if (ele.properties.centroid) {
        const [x, y] = prj(ele.properties.centroid);
        province.properties._centroid = [x, y];
      }
      this.map.add(province);
    });
    this.scene.add(this.map);
  }
  initThree() {
    this.scene = new THREE.Scene();
    // 设置场景背景色
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.map = new THREE.Object3D();

    const fov = 35;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 10000;
    // 相机
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // 设置摄像机的位置
    this.camera.position.set(0, -70, 90);
    this.camera.lookAt(0, 0, 0);

    const canvas = document.querySelector("#map");
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      canvas,
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight - 10);

    // 添加灯光
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(300, 1000, 500);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
    this.scene.add(light);

    //网格和坐标
    const axesHelper = new THREE.AxesHelper(2000);
    this.scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(600, 60);
    this.scene.add(gridHelper);
    const controls = new Orbitcontrols(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.35;
  }

  onWindowResize(){
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth / window.innerHeight);
  }

  componentDidMount() {
    this.initThree();
    this.initMap();

    this.renderer.render(this.scene, this.camera);
    document.addEventListener("mousemove", this.onMouseMove, false);
    window.addEventListener("resize", this.onWindowResize, false);
  }

  render() {
    return (
      <div id="container">
        <canvas id="map"></canvas>
        <canvas id="name"></canvas>
      </div>
    );
  }
}
