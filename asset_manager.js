// --- START OF FILE asset_manager.js ---
window.AssetManager = {
    assets: {}, // For assets it loads directly (like audio)
    queue: [],  // For assets it loads directly
    externalTasks: [], // For tasks like your image loaders
    successCount: 0,
    errorCount: 0,
    externalTasksCompleted: 0,
    downloadAllCallback: null,
    progressCallback: null,

    // For assets AssetManager loads itself (e.g., audio)
    addAsset(path, type = 'image', alias = null) {
        this.queue.push({ path, type, alias: alias || path });
    },

    // For registering external loading processes
    addExternalLoadingTask(taskName) {
        this.externalTasks.push({ name: taskName, completed: false });
    },

    completeExternalLoadingTask(taskName) {
        const task = this.externalTasks.find(t => t.name === taskName);
        if (task && !task.completed) {
            task.completed = true;
            this.externalTasksCompleted++;
            console.log(`External task completed: ${taskName}`);
            this.checkIfAllDone();
        } else if (task && task.completed) {
            console.warn(`External task ${taskName} was already marked completed.`);
        } else {
            console.warn(`Attempted to complete unknown external task: ${taskName}`);
        }
    },

    updateProgress() {
        if (this.progressCallback) {
            const directQueueTotal = this.queue.length;
            const externalTasksTotal = this.externalTasks.length;
            const totalItems = directQueueTotal + externalTasksTotal;
            const completedItems = this.successCount + this.errorCount + this.externalTasksCompleted;
            this.progressCallback(completedItems, totalItems);
        }
    },

    downloadAll(callbackProgress, callbackDone) {
        this.downloadAllCallback = callbackDone;
        this.progressCallback = callbackProgress;

        this.updateProgress(); // Initial progress update

        if (this.queue.length === 0 && this.externalTasks.length === 0) {
            if(this.downloadAllCallback) this.downloadAllCallback();
            return;
        }

        // Start loading direct assets
        this.queue.forEach(assetInfo => {
            if (assetInfo.type === 'image') { // AssetManager can still load images if needed
                const img = new Image();
                img.addEventListener("load", () => {
                    console.log("Loaded asset (AM): " + assetInfo.path);
                    this.successCount += 1;
                    this.assets[assetInfo.alias] = img;
                    this.updateProgress();
                    this.checkIfAllDone();
                });
                img.addEventListener("error", () => {
                    console.error("Error loading asset (AM): " + assetInfo.path);
                    this.errorCount += 1;
                    this.assets[assetInfo.alias] = null;
                    this.updateProgress();
                    this.checkIfAllDone();
                });
                img.src = assetInfo.path;
            } else if (assetInfo.type === 'audio') {
                const audio = new Audio();
                audio.addEventListener("canplaythrough", () => {
                    console.log("Loaded asset (AM): " + assetInfo.path);
                    this.successCount += 1;
                    this.assets[assetInfo.alias] = audio;
                    this.updateProgress();
                    this.checkIfAllDone();
                });
                 audio.addEventListener("error", (e) => {
                    console.error("Error loading asset (AM): " + assetInfo.path, e);
                    this.errorCount += 1;
                    this.assets[assetInfo.alias] = null;
                    this.updateProgress();
                    this.checkIfAllDone();
                });
                audio.preload = "auto";
                audio.src = assetInfo.path;
                audio.load();
            }
        });
        this.checkIfAllDone(); // Check if only external tasks were present or direct queue was empty
    },

    isDone() {
        const directAssetsDone = (this.queue.length === this.successCount + this.errorCount);
        const externalTasksDone = (this.externalTasks.length === this.externalTasksCompleted);
        return directAssetsDone && externalTasksDone;
    },

    checkIfAllDone() {
        if (this.isDone() && this.downloadAllCallback) {
            console.log("AssetManager: All tasks and assets complete.");
            this.downloadAllCallback();
        }
    },

    getAsset(alias) {
        // For externally loaded assets, they won't be in this.assets
        // The original global variables (imgWall, zombieSprites) should be used
        if (this.assets[alias]) {
            return this.assets[alias];
        }
        // console.warn(`Asset with alias "${alias}" not found in AssetManager direct assets.`);
        return null; // Or handle differently if AssetManager is sole source
    },

    reset() {
         this.assets = {};
         this.queue = [];
         this.externalTasks = [];
         this.successCount = 0;
         this.errorCount = 0;
         this.externalTasksCompleted = 0;
         this.downloadAllCallback = null;
         this.progressCallback = null;
    }
};
// --- END OF FILE asset_manager.js ---