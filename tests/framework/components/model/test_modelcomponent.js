describe("pc.ModelComponent", function () {
    var app;
    var assets = {};

    beforeEach(function (done) {
        app = new pc.Application(document.createElement("canvas"));
        loadAssets(function () {
            done();
        });
    });

    afterEach(function () {
        app.destroy();
        assets = {};
    });

    var loadAssetList = function (list, cb) {
        // listen for asset load events and fire cb() when all assets are loaded
        var count = 0;
        app.assets.on('load', function (asset) {
            count++;
            if (count === list.length) {
                cb();
            }
        });

        // add and load assets
        for (var i = 0; i < list.length; i++) {
            app.assets.add(list[i]);
            app.assets.load(list[i]);
        }
    };

    var loadAssets = function (cb) {
        var assetlist = [
            new pc.Asset('Statue_1.json', 'model', {
                url: 'base/examples/assets/statue/Statue_1.json'
            }),
            new pc.Asset('Statue_Material', 'material', {
                url: 'base/examples/assets/statue/11268/phong9.json'
            })
        ];

        loadAssetList(assetlist, function () {
            assets.model = assetlist[0];
            assets.material = assetlist[1];
            cb();
        });
    };


    it('Create default model component', function () {
        var e = new pc.Entity();
        e.addComponent("model");

        expect(e.model.type).to.equal('asset');
        expect(e.model.asset).to.equal(null);
        expect(e.model.castShadows).to.equal(true);
        expect(e.model.receiveShadows).to.equal(true);
        expect(e.model.castShadowsLightmap).to.equal(true);
        expect(e.model.lightmapped).to.equal(false);
        expect(e.model.lightmapSizeMultiplier).to.equal(1);
        expect(e.model.isStatic).to.equal(false);
        expect(e.model.model).to.equal(null);
        // expect(e.model.material).to.equal(app.systems.model.defaultMaterial);
        expect(e.model.mapping).to.be.empty;
        expect(e.model.layers).to.contain(pc.LAYERID_WORLD);
        expect(e.model.batchGroupId).to.equal(-1);

    });

    it('Set modelAsset and model', function () {
        var e = new pc.Entity();
        e.addComponent('model', {
            asset: assets.model
        });
        app.root.addChild(e);

        expect(e.model.asset).to.not.be.null;
        expect(e.model.asset).to.equal(assets.model.id);
        expect(e.model.model).to.not.be.null;
    });

    it('Default cloned model component is identical', function () {
        var e = new pc.Entity();
        e.addComponent('model', {
            asset: assets.model
        });
        app.root.addChild(e);

        var c = e.clone();
        app.root.addChild(c);

        expect(c.model.asset).to.equal(assets.model.id);
        expect(c.model.model).to.not.be.null;
        expect(c.model.type).to.equal(e.model.type);
        expect(c.model.castShadows).to.equal(e.model.castShadows);
        expect(c.model.receiveShadows).to.equal(e.model.receiveShadows);
        expect(c.model.castShadowsLightmap).to.equal(e.model.castShadowsLightmap);
        expect(c.model.lightmapped).to.equal(e.model.lightmapped);
        expect(c.model.lightmapSizeMultiplier).to.equal(e.model.lightmapSizeMultiplier);
        expect(c.model.isStatic).to.equal(e.model.isStatic);
        expect(c.model.batchGroupId).to.equal(e.model.batchGroupId);
        expect(c.model.layers).to.deep.equal(e.model.layers);
    });


    it('Cloned model component with flags set has correct meshinstance flags', function () {
        var e = new pc.Entity();
        e.addComponent('model', {
            asset: assets.model,
            lightmapped: true,
            receiveShadows: true,
            castShadows: true,
            isStatic: true
        });
        app.root.addChild(e);

        var c = e.clone();
        app.root.addChild(c);

        var srcMi = e.model.meshInstances;
        var dstMi = c.model.meshInstances;

        for (var i = 0; i< srcMi.length; i++) {
            expect(srcMi[i].mask).to.equal(dstMi[i].mask);
            expect(srcMi[i].layer).to.equal(dstMi[i].layer);
            expect(srcMi[i].receiveShadow).to.equal(dstMi[i].receiveShadow);
            expect(srcMi[i].castShadow).to.equal(dstMi[i].castShadow);
            expect(srcMi[i].isStatic).to.equal(dstMi[i].isStatic);
            expect(srcMi[i].material.id).to.exist;
            expect(srcMi[i].material.id).to.equal(dstMi[i].material.id);
        }

    });



    it('Cloned model component with flags set directly on mesh instance is identical', function () {
        var e = new pc.Entity();
        e.addComponent('model', {
            asset: assets.model
        });
        app.root.addChild(e);

        e.model.model.meshInstances[0].receiveShadow = true;
        e.model.model.meshInstances[0].castShadow = true;
        e.model.model.meshInstances[0].mask = 16;
        e.model.model.meshInstances[0].layer = 16;

        // // TODO: these don't get copied,
        // e.model.model.meshInstances[0].isStatic = true;
        // e.model.model.meshInstances[0].screenSpace = true;

        var c = e.clone();
        app.root.addChild(c);

        var srcMi = e.model.meshInstances;
        var dstMi = c.model.meshInstances;

        for (var i = 0; i< srcMi.length; i++) {
            expect(srcMi[i].receiveShadow).to.equal(dstMi[i].receiveShadow);
            expect(srcMi[i].castShadow).to.equal(dstMi[i].castShadow);
            expect(srcMi[i].mask).to.equal(dstMi[i].mask);
            expect(srcMi[i].layer).to.equal(dstMi[i].layer);
        }
    });

    it('ModelAsset unbinds on destroy', function () {
        var e = new pc.Entity();
        app.root.addChild(e);
        e.addComponent('model', {
            asset: assets.model
        });

        expect(assets.model.hasEvent('load')).to.be.true;
        expect(assets.model.hasEvent('unload')).to.be.true;
        expect(assets.model.hasEvent('change')).to.be.true;
        expect(assets.model.hasEvent('remove')).to.be.true;

        e.destroy();

        expect(assets.model.hasEvent('load')).to.be.false;
        expect(assets.model.hasEvent('remove')).to.be.false;
        expect(assets.model.hasEvent('change')).to.be.false;
        expect(assets.model.hasEvent('unload')).to.be.false;
    });

    it('ModelAsset unbinds on reset', function () {
        var e = new pc.Entity();
        app.root.addChild(e);
        e.addComponent('model', {
            asset: assets.model
        });

        expect(assets.model.hasEvent('load')).to.be.true;
        expect(assets.model.hasEvent('unload')).to.be.true;
        expect(assets.model.hasEvent('change')).to.be.true;
        expect(assets.model.hasEvent('remove')).to.be.true;

        e.model.asset = null;

        expect(assets.model.hasEvent('load')).to.be.false;
        expect(assets.model.hasEvent('remove')).to.be.false;
        expect(assets.model.hasEvent('change')).to.be.false;
        expect(assets.model.hasEvent('unload')).to.be.false;
    });

    it('Material Asset unbinds on destroy', function () {
        var e = new pc.Entity();
        app.root.addChild(e);
        e.addComponent('model', {
            type: "box",
            materialAsset: assets.material
        });

        expect(assets.material.hasEvent('load')).to.be.true;
        expect(assets.material.hasEvent('unload')).to.be.true;
        expect(assets.material.hasEvent('change')).to.be.true;
        expect(assets.material.hasEvent('remove')).to.be.true;

        e.destroy();

        expect(assets.material.hasEvent('load')).to.be.false;
        expect(assets.material._callbacks.unload.length).to.equal(1);
        expect(assets.material.hasEvent('change')).to.be.false;
        expect(assets.material.hasEvent('remove')).to.be.false;
    });

    it('Material Asset unbinds on reset', function () {
        var e = new pc.Entity();
        app.root.addChild(e);
        e.addComponent('model', {
            type: "box",
            materialAsset: assets.material
        });

        expect(assets.material.hasEvent('load')).to.be.true;
        expect(assets.material.hasEvent('unload')).to.be.true;
        expect(assets.material.hasEvent('change')).to.be.true;
        expect(assets.material.hasEvent('remove')).to.be.true;

        e.model.materialAsset = null

        expect(assets.material.hasEvent('load')).to.be.false;
        expect(assets.material.hasEvent('remove')).to.be.false;
        expect(assets.material.hasEvent('change')).to.be.false;
        expect(assets.material._callbacks.unload.length).to.equal(1);
    });

    it("Materials applied when loading asynchronously", function (done) {
        var boxAsset = new pc.Asset("Box", "model", {
            url: "base/tests/test-assets/box/box.json"
        }, {
            "mapping": [
                {
                    "path": "1/Box Material.json"
                }
            ],
            "area": 0
        });

        var materialAsset = new pc.Asset("Box Material", "material",  {
            url: "base/tests/test-assets/box/1/Box Material.json"
        });

        app.assets.add(boxAsset);
        app.assets.add(materialAsset);

        app.assets.load(boxAsset);

        boxAsset.on("load", function () {
            var e = new pc.Entity();
            e.addComponent('model', {
                asset: boxAsset
            });
            app.root.addChild(e);

            expect(app.assets.hasEvent('load:'+materialAsset.id)).to.be.true;

            done();
        });
    });

    it("Layers are initialized before model is set", function () {
        var e = new pc.Entity();
        e.addComponent("model", {
            layers: [pc.LAYERID_UI]
        });

        expect(e.model.model).to.be.null;
        expect(e.model.layers[0]).to.equal(pc.LAYERID_UI);

        e.model.asset = assets.model;

        expect(e.model.layers[0]).to.equal(pc.LAYERID_UI);
        expect(e.model.model).to.not.be.null;

    });
});
