import * as THREE from 'three';

function makeWheel(radius = 0.38, width = 0.28, rimColor = 0xdbeafe) {
  const wheelGroup = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.08,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.22,
    metalness: 0.88,
  });

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    tireMat
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width + 0.02, 12),
    rimMat
  );
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width + 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.3, metalness: 0.6 })
  );
  hub.rotation.z = Math.PI / 2;
  wheelGroup.add(hub);

  return wheelGroup;
}

export function createVehicleModel(type = 'sport', paintHex = 0x00e5ff) {
  const root = new THREE.Group();
  const wheels = [];
  const frontWheelPivots = [];

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: paintHex,
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.65,
    metalness: 0.25,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.85,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 2.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff2244,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
  });

  if (type === 'moto') {
    // Superbike Motorcycle (composite 8 parts)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 1.85), trimMat);
    frame.position.set(0, 0.56, 0);
    frame.castShadow = true;
    root.add(frame);

    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 1.25), bodyMat);
    fairing.position.set(0, 0.78, -0.18);
    fairing.castShadow = true;
    root.add(fairing);

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.26, 0.62), bodyMat);
    tank.position.set(0, 0.94, 0.05);
    root.add(tank);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.68), trimMat);
    seat.position.set(0, 0.88, 0.52);
    root.add(seat);

    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.35), glassMat);
    windscreen.position.set(0, 1.08, -0.58);
    windscreen.rotation.x = 0.55;
    root.add(windscreen);

    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.08), headlightMat);
    headlight.position.set(0, 0.82, -0.84);
    root.add(headlight);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 }));
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.26, 0.45, 0.62);
    root.add(exhaust);

    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.36, -0.82);
    const fw = makeWheel(0.36, 0.16, 0xf8fafc);
    frontPivot.add(fw);
    root.add(frontPivot);
    frontWheelPivots.push(frontPivot);
    wheels.push(fw);

    const rw = makeWheel(0.37, 0.22, 0xf8fafc);
    rw.position.set(0, 0.37, 0.78);
    root.add(rw);
    wheels.push(rw);

    return { group: root, wheels, frontWheelPivots, cameraSeatY: 1.35 };
  }

  if (type === 'formula') {
    // Formula 1 Race Car (composite 10 parts)
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.38, 3.8), bodyMat);
    chassis.position.set(0, 0.38, 0.1);
    chassis.castShadow = true;
    root.add(chassis);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 1.25), bodyMat);
    nose.position.set(0, 0.32, -2.05);
    nose.castShadow = true;
    root.add(nose);

    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.52), trimMat);
    frontWing.position.set(0, 0.18, -2.35);
    frontWing.castShadow = true;
    root.add(frontWing);

    const sidepodL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 1.65), bodyMat);
    sidepodL.position.set(-0.64, 0.34, 0.15);
    root.add(sidepodL);

    const sidepodR = sidepodL.clone();
    sidepodR.position.x = 0.64;
    root.add(sidepodR);

    const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.85), bodyMat);
    airbox.position.set(0, 0.74, 0.48);
    root.add(airbox);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16, Math.PI), trimMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.66, -0.25);
    root.add(halo);

    const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.46), trimMat);
    rearWing.position.set(0, 0.98, 1.88);
    rearWing.castShadow = true;
    root.add(rearWing);

    const rearPillar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.3), trimMat);
    rearPillar.position.set(0, 0.68, 1.88);
    root.add(rearPillar);

    const positions = [
      [-1.02, 0.38, -1.45, true],
      [1.02, 0.38, -1.45, true],
      [-1.05, 0.4, 1.38, false],
      [1.05, 0.4, 1.38, false],
    ];
    for (const [wx, wy, wz, isFront] of positions) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, wy, wz);
      const w = makeWheel(isFront ? 0.38 : 0.4, 0.38, 0xfacc15);
      pivot.add(w);
      root.add(pivot);
      wheels.push(w);
      if (isFront) frontWheelPivots.push(pivot);
    }

    return { group: root, wheels, frontWheelPivots, cameraSeatY: 0.92 };
  }

  if (type === 'truck') {
    // Heavy Cargo Truck
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.45, 5.2), trimMat);
    chassis.position.set(0, 0.56, 0.2);
    chassis.castShadow = true;
    root.add(chassis);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.55, 1.8), bodyMat);
    cab.position.set(0, 1.48, -1.35);
    cab.castShadow = true;
    root.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.68, 0.12), glassMat);
    windshield.position.set(0, 1.72, -2.22);
    root.add(windshield);

    const cargoBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.22, 1.9, 3.35),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.15 })
    );
    cargoBox.position.set(0, 1.68, 1.18);
    cargoBox.castShadow = true;
    root.add(cargoBox);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), headlightMat);
    hlL.position.set(-0.74, 0.92, -2.26);
    root.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = 0.74;
    root.add(hlR);

    const wheelPts = [
      [-1.08, 0.48, -1.55, true],
      [1.08, 0.48, -1.55, true],
      [-1.08, 0.48, 0.95, false],
      [1.08, 0.48, 0.95, false],
      [-1.08, 0.48, 2.05, false],
      [1.08, 0.48, 2.05, false],
    ];
    for (const [wx, wy, wz, isFront] of wheelPts) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, wy, wz);
      const w = makeWheel(0.48, 0.34, 0x94a3b8);
      pivot.add(w);
      root.add(pivot);
      wheels.push(w);
      if (isFront) frontWheelPivots.push(pivot);
    }

    return { group: root, wheels, frontWheelPivots, cameraSeatY: 2.1 };
  }

  // Sport / Super / Drift / Offroad / Taxi Cars (composite 10 parts)
  const isOffroad = type === 'offroad';
  const isTaxi = type === 'taxi';
  const rideLift = isOffroad ? 0.24 : 0;

  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(isOffroad ? 2.05 : 1.94, isOffroad ? 0.62 : 0.52, 4.15),
    bodyMat
  );
  lowerBody.position.set(0, 0.52 + rideLift, 0);
  lowerBody.castShadow = true;
  root.add(lowerBody);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, isOffroad ? 0.58 : 0.46, 2.05),
    bodyMat
  );
  cabin.position.set(0, 0.98 + rideLift, 0.16);
  cabin.castShadow = true;
  root.add(cabin);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.4, 2.1), glassMat);
  windshield.position.set(0, 0.98 + rideLift, 0.16);
  root.add(windshield);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.1, 0.42), trimMat);
  splitter.position.set(0, 0.28 + rideLift, -1.96);
  root.add(splitter);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.16, 0.25), trimMat);
  diffuser.position.set(0, 0.32 + rideLift, 2.02);
  root.add(diffuser);

  if (type === 'sport' || type === 'drift' || type === 'hyper') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.08, 0.34), trimMat);
    wing.position.set(0, 1.06 + rideLift, 1.92);
    wing.castShadow = true;
    root.add(wing);
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.2), trimMat);
    strutL.position.set(-0.58, 0.9 + rideLift, 1.92);
    root.add(strutL);
    const strutR = strutL.clone();
    strutR.position.x = 0.58;
    root.add(strutR);
  }

  if (isTaxi) {
    const taxiSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.18, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 1.6,
      })
    );
    taxiSign.position.set(0, 1.3 + rideLift, 0.1);
    root.add(taxiSign);
  }

  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), headlightMat);
  hlL.position.set(-0.68, 0.56 + rideLift, -2.07);
  root.add(hlL);
  const hlR = hlL.clone();
  hlR.position.x = 0.68;
  root.add(hlR);

  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), taillightMat);
  tlL.position.set(-0.66, 0.58 + rideLift, 2.08);
  root.add(tlL);
  const tlR = tlL.clone();
  tlR.position.x = 0.66;
  root.add(tlR);

  const wheelRadius = isOffroad ? 0.48 : 0.37;
  const wheelY = wheelRadius;
  const wheelPts = [
    [-0.96, wheelY, -1.32, true],
    [0.96, wheelY, -1.32, true],
    [-0.96, wheelY, 1.34, false],
    [0.96, wheelY, 1.34, false],
  ];
  for (const [wx, wy, wz, isFront] of wheelPts) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, wy, wz);
    const w = makeWheel(wheelRadius, isOffroad ? 0.34 : 0.28, 0xe2e8f0);
    pivot.add(w);
    root.add(pivot);
    wheels.push(w);
    if (isFront) frontWheelPivots.push(pivot);
  }

  return { group: root, wheels, frontWheelPivots, cameraSeatY: 1.12 + rideLift };
}

export function createAirplaneModel(colorHex = 0x38bdf8) {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.25,
    clearcoat: 0.9,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.1, metalness: 0.8, emissive: 0x0284c7, emissiveIntensity: 0.35 });

  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.6, 12), bodyMat);
  fuselage.rotation.x = -Math.PI / 2;
  fuselage.castShadow = true;
  root.add(fuselage);

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 1.05), glassMat);
  cockpit.position.set(0, 0.32, -0.3);
  root.add(cockpit);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 1.05), bodyMat);
  mainWing.position.set(0, 0, 0.15);
  mainWing.castShadow = true;
  root.add(mainWing);

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.55), trimMat);
  tailWing.position.set(0, 0.1, 1.45);
  root.add(tailWing);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.65), bodyMat);
  tailFin.position.set(0, 0.45, 1.45);
  root.add(tailFin);

  const burner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.16, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf97316, emissiveIntensity: 2.2 })
  );
  burner.rotation.x = Math.PI / 2;
  burner.position.set(0, 0, 1.85);
  root.add(burner);

  return root;
}

export function createSpaceshipModel(colorHex = 0x8b5cf6) {
  const root = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({ color: colorHex, metalness: 0.72, roughness: 0.2, clearcoat: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.0 });

  const core = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 2.8), hullMat);
  root.add(core);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.2, 6), hullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.95;
  root.add(nose);

  const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.3), darkMat);
  wingL.position.set(-1.15, 0, 0.3);
  wingL.rotation.z = -0.16;
  root.add(wingL);

  const wingR = wingL.clone();
  wingR.position.x = 1.15;
  wingR.rotation.z = 0.16;
  root.add(wingR);

  const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 10), glowMat);
  thrusterL.rotation.x = Math.PI / 2;
  thrusterL.position.set(-0.55, 0, 1.5);
  root.add(thrusterL);

  const thrusterR = thrusterL.clone();
  thrusterR.position.x = 0.55;
  root.add(thrusterR);

  return root;
}

export function createDinoModel(colorHex = 0x10b981) {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.65, metalness: 0.08 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.75 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.8), skinMat);
  body.position.set(0, 1.15, 0);
  body.castShadow = true;
  root.add(body);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.6), skinMat);
  neck.position.set(0, 1.75, -0.75);
  root.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 1.05), skinMat);
  head.position.set(0, 2.25, -1.05);
  head.castShadow = true;
  root.add(head);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.6, 8), skinMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 1.1, 1.55);
  root.add(tail);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 1.2), bellyMat);
  crest.position.set(0, 1.72, 0.15);
  root.add(crest);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.75, 0.42), skinMat);
  legL.position.set(-0.36, 0.38, 0);
  root.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.36;
  root.add(legR);

  return { group: root, legL, legR };
}

export function createRobotModel(colorHex = 0x38bdf8) {
  const root = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.78, roughness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.8 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 0.7), metalMat);
  torso.position.set(0, 1.35, 0);
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.62), metalMat);
  head.position.set(0, 2.28, 0);
  root.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.08), visorMat);
  visor.position.set(0, 2.3, -0.32);
  root.add(visor);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.3), darkMat);
  armL.position.set(-0.72, 1.35, 0);
  root.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.72;
  root.add(armR);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.78, 0.36), darkMat);
  legL.position.set(-0.28, 0.39, 0);
  root.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.28;
  root.add(legR);

  return { group: root, legL, legR };
}

export function createSubmarineModel(colorHex = 0xf59e0b) {
  const root = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({ color: colorHex, metalness: 0.4, roughness: 0.3, clearcoat: 0.6 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 });

  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.8, 8, 16), hullMat);
  hull.rotation.x = Math.PI / 2;
  root.add(hull);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.58, 0.85), hullMat);
  tower.position.set(0, 0.72, -0.1);
  root.add(tower);

  const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), glassMat);
  windowMesh.position.set(0, 0.05, -1.35);
  root.add(windowMesh);

  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.08), trimMat);
  prop.position.set(0, 0, 1.58);
  root.add(prop);

  return { group: root, prop };
}
