import { Component, OnInit } from "@angular/core";
import {
  MediaCapture,
  MediaFile,
  CaptureError,
} from "@ionic-native/media-capture/ngx";
import { StreamingMedia } from "@ionic-native/streaming-media/ngx";
import {
  Plugins,
  FilesystemDirectory,
  ReaddirResult,
  FilesystemEncoding,
  GetUriResult,
} from "@capacitor/core";
import { IonItemSliding } from "@ionic/angular";

const { Filesystem } = Plugins;

const MEDIA_FOLDER_NAME = "my_media";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {
  files: string[] = [];

  constructor(
    private mediaCapture: MediaCapture,
    private streamingMedia: StreamingMedia
  ) {}

  async ngOnInit() {
    console.log("In ngOnInit");
    try {
      await this.readdir();
      await this.loadFiles();
    } catch (exp) {
      await this.mkdir();
    }
    console.log("Finished ngOnInit");
  }

  async readdir() {
    try {
      let ret = await Filesystem.readdir({
        path: MEDIA_FOLDER_NAME,
        directory: FilesystemDirectory.Documents,
      });
    } catch (e) {
      console.error("Unable to read dir:" + e);
      throw e;
    }
  }

  async mkdir() {
    try {
      let ret = await Filesystem.mkdir({
        path: MEDIA_FOLDER_NAME,
        directory: FilesystemDirectory.Documents,
        recursive: false, // like mkdir -p
      });
    } catch (e) {
      console.error("Unable to make directory:" + e);
    }
  }

  async loadFiles() {
    try {
      let ret: ReaddirResult = await Filesystem.readdir({
        path: MEDIA_FOLDER_NAME,
        directory: FilesystemDirectory.Documents,
      });
      console.log("Loadfiles return:" + JSON.stringify(ret.files));
      this.files = ret.files;
    } catch (e) {
      console.error("Unable to read dir" + e);
    }
  }

  onRecordVideo() {
    this.mediaCapture.captureVideo().then(
      async (data: MediaFile[]) => {
        if (data.length > 0) {
          await this.copyFileToLocalDir(data[0].fullPath);
          await this.loadFiles();
        }
      },
      (err: CaptureError) =>
        console.error("capture error:" + JSON.stringify(err))
    );
  }

  async copyFileToLocalDir(fullPath) {
    console.log("copyFileToLocalDir. fullpath->" + JSON.stringify(fullPath));
    let myPath = fullPath;
    // Make sure we copy from the right location
    if (fullPath.indexOf("file://") < 0) {
      myPath = "file://" + fullPath;
    }

    const ext = myPath.split(".").pop();
    const d = Date.now();
    const newName = `/${MEDIA_FOLDER_NAME}/${d}.${ext}`;

    console.log("myPath, newName:" + myPath + " : " + newName);
    try {
      // This example copies a file within the documents directory
      let ret = await Filesystem.copy({
        from: myPath,
        to: newName,
        toDirectory: FilesystemDirectory.Documents,
      });
    } catch (e) {
      console.error("Unable to copy file:" + e);
    }
  }

  async openFile(f: string) {
    console.log("In openFile. f:->" + f);
    try {
      let uriResult: GetUriResult = await Filesystem.getUri({
        directory: FilesystemDirectory.Documents,
        path: `/${MEDIA_FOLDER_NAME}/${f}`,
      });
      const uri = uriResult.uri;
      this.streamingMedia.playVideo(uri);
    } catch (err) {
      console.error("Unable to copy file:" + err);
    }
  }

  async deleteFile(f: string, slidingItem: IonItemSliding) {
    console.log("In deleteFile. f:->" + JSON.stringify(f));
    try {
      let deleteResult = await Filesystem.deleteFile({
        directory: FilesystemDirectory.Documents,
        path: `/${MEDIA_FOLDER_NAME}/${f}`,
      });
      slidingItem.close();
      await this.loadFiles();

      console.log("File delted successfully");
    } catch (err) {
      console.error("Unable to copy file:" + err);
    }
  }
}
