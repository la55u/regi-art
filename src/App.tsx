import * as THREE from "three";
import { ReactNode, useRef, useState } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  useFBO,
  useGLTF,
  useScroll,
  Text,
  Image,
  Scroll,
  Preload,
  ScrollControls,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import { easing } from "maath";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 15 }}>
      <ScrollControls damping={0.2} pages={3} distance={0.5}>
        <Lens>
          <Scroll>
            <Typography />
            <Images />
          </Scroll>
          <Scroll html>
            <div style={{ transform: "translate3d(65vw, 192vh, 0)", fontSize: "2rem" }}>
              PMNDRS Pendant lamp
              <br />
              éjkék, fehér, bronz
              <br />
              HUF 30.000
              <br />
            </div>
          </Scroll>
          {/** This is a helper that pre-emptively makes threejs aware of all geometries, textures etc
               By default threejs will only process objects if they are "seen" by the camera leading 
               to jank as you scroll down. With <Preload> that's solved.  */}
          <Preload />
        </Lens>
      </ScrollControls>
    </Canvas>
  );
}

function Lens({
  children,
  damping = 0.15,
  ...props
}: {
  children: ReactNode;
  damping?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { nodes } = useGLTF("/lens-transformed.glb");
  const buffer = useFBO();
  const viewport = useThree((state) => state.viewport);
  const [scene] = useState(() => new THREE.Scene());
  useFrame((state, delta) => {
    // Tie lens to the pointer
    // getCurrentViewport gives us the width & height that would fill the screen in threejs units
    // By giving it a target coordinate we can offset these bounds, for instance width/height for a plane that
    // sits 15 units from 0/0/0 towards the camera (which is where the lens is)
    const viewport = state.viewport.getCurrentViewport(state.camera, [0, 0, 15]);
    easing.damp3(
      //@ts-expect-error dunno
      ref.current.position,
      [
        (state.pointer.x * viewport.width) / 2,
        (state.pointer.y * viewport.height) / 2,
        15,
      ],
      damping,
      delta
    );
    // This is entirely optional but spares us one extra render of the scene
    // The createPortal below will mount the children of <Lens> into the new THREE.Scene above
    // The following code will render that scene into a buffer, whose texture will then be fed into
    // a plane spanning the full screen and the lens transmission material
    state.gl.setRenderTarget(buffer);
    state.gl.setClearColor("#C7CDC6" /* "#d8d7d7" */);
    state.gl.render(scene, state.camera);
    state.gl.setRenderTarget(null);
  });
  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} />
      </mesh>
      <mesh
        scale={0.25}
        ref={ref}
        rotation-x={Math.PI / 2}
        //@ts-expect-error custom model geom
        geometry={nodes.Cylinder.geometry}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={1.2}
          thickness={1.5}
          anisotropy={0.1}
          chromaticAberration={0.04}
          //TODO remove default
          distortionScale={0.5}
          //TODO remove default
          temporalDistortion={0}
        />
      </mesh>
    </>
  );
}

function Images() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const group = useRef<THREE.Group & { children: any }>(null);
  const data = useScroll();
  const { width, height } = useThree((state) => state.viewport);
  useFrame(() => {
    if (!group.current) return;
    group.current.children[0].material.zoom = 1 + data.range(0, 1 / 3) / 3;
    group.current.children[1].material.zoom = 1 + data.range(0, 1 / 3) / 3;
    group.current.children[2].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
    group.current.children[3].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
    group.current.children[4].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2;
    group.current.children[5].material.grayscale = 1 - data.range(1.6 / 3, 1 / 3);
    group.current.children[6].material.zoom = 1 + (1 - data.range(2 / 3, 1 / 3)) / 3;
  });
  return (
    <group ref={group}>
      <Image position={[-width / 4, 0, 0]} scale={[width / 2, height]} url="/img5.jpg" />
      <Image position={[2, 0, 3]} scale={3} url="/img1.jpg" />
      <Image position={[-2.05, -height, 6]} scale={[1, 1]} url="/img4.jpg" />
      <Image position={[-0.6, -height, 9]} scale={[1, 1]} url="/img8.jpg" />
      <Image position={[0.75, -height, 10.5]} scale={1.5} url="/img6.jpg" />
      <Image position={[0, -height * 1.5, 7.5]} scale={[2, 3]} url="/img3.jpg" />
      <Image
        position={[0, -height * 2 - height / 4, 0]}
        scale={[width, height / 1.1]}
        url="/img7.jpg"
      />
    </group>
  );
}

function Typography() {
  const state = useThree();
  const { width, height } = state.viewport.getCurrentViewport(state.camera, [0, 0, 12]);
  const shared = { font: "/Inter-Regular.woff", letterSpacing: -0.1, color: "black" };
  return (
    <>
      <Text
        children="egyedi"
        anchorX="left"
        position={[-width / 2.5, -height / 10, 12]}
        fontSize={0.6}
        {...shared}
      />
      <Text
        children="dekor"
        anchorX="right"
        position={[width / 2.5, -height * 2, 12]}
        {...shared}
      />
      <Text children="neked" position={[0, -height * 4.624, 12]} {...shared} />
    </>
  );
}
