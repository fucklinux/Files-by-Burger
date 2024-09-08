// 事件监听相关
//
// 页面加载完成时执行
window.addEventListener("load", function () {
    // 禁用加载效果和下拉刷新
    window.webapp.circle(false);
    window.webapp.renew(false);
    // 检测有无存储权限
    if (window.webapp.bestow()) {
        // 载入设置
        loadSettings();
        // 打开启动目录
        if (settings.bootDirectory == "上次打开的目录") {
            loadFiles(localStorage.getItem("lastPath"));
            document.querySelector("#path").innerText = localStorage.getItem("lastPath");
        } else {
            loadFiles(settings.bootDirectory);
            document.querySelector("#path").innerText = settings.bootDirectory;
        }
        // 获取书签
        loadBookmarks();
        // 响应式显示抽屉栏
        setTimeout(function () {
            document.documentElement.clientWidth >= 840 ? (document.querySelector("#drawer").open = true) : undefined;
        }, 300);
    } else {
        document.querySelector("#setupPermissionDialog").open = true;
    }
    // 申请存储权限回调
    window.webapp.behold("navigation.reload();");
    // 获取版本信息
    document.querySelector("#version").innerText = "Version " + window.webapp.getpage() + " (" + window.webapp.getcode() + ")";
    // 初始化对话框
    document.querySelector("#newItemDialog").addEventListener("open", function () {
        document.querySelector("#newItemType").value = "folder";
        document.querySelector("#newItemName").value = "";
    });
    document.querySelector("#newItemDialog").addEventListener("opened", function () {
        document.querySelector("#newItemName").focus();
    });
    document.querySelector("#renameItemDialog").addEventListener("opened", function () {
        document.querySelector("#renameItemName").focus();
    });
    document.querySelector("#searchItemDialog").addEventListener("opened", function () {
        document.querySelector("#searchKeyword").focus();
    });
    document.querySelector("#setPathDialog").addEventListener("open", function () {
        document.querySelector("#pathInput").value = document.querySelector("#path").innerText;
    });
    document.querySelector("#setPathDialog").addEventListener("opened", function () {
        document.querySelector("#pathInput").focus();
    });
    document.querySelector("#multipleSelectDialog").addEventListener("open", function () {
        // 获取已显示的文件列表
        var fileListItems = document.querySelectorAll(".file-list-item");
        // 初始化文件列表的 HTML 代码
        var html = "";
        fileListItems.forEach(function (item) {
            if (item.style.display != "none") {
                html += `<mdui-list-item headline="` + item.headline + `" description="` + (item.description == undefined ? "" : item.description) + `" icon="` + item.icon + `" class="multiple-select-list-item">
    <mdui-checkbox slot="end-icon" name="multipleSelectCheckbox"></mdui-checkbox>    
</mdui-list-item>`;
            }
        });
        if (html == "") {
            html += `<div style="text-align: center;margin: 16px 0;">没有项目</div>`;
        }
        // 填入文件列表的 HTML 代码
        document.querySelector("#multipleSelectList").innerHTML = html;
    });
    // 自动刷新文件列表
    document.querySelector("#settingsDialog").addEventListener("closed", function () {
        refreshFileList();
    });
    // 回车键操作
    document.querySelector("#newItemName").onkeyup = function (key) {
        if (key.keyCode == 13) {
            newItem();
        }
    };
    document.querySelector("#renameItemName").onkeyup = function (key) {
        if (key.keyCode == 13) {
            renameItem(true);
        }
    };
    document.querySelector("#searchKeyword").onkeyup = function (key) {
        if (key.keyCode == 13) {
            searchItem();
        }
    };
    document.querySelector("#pathInput").onkeyup = function (key) {
        if (key.keyCode == 13) {
            setPath();
        }
    };
    // 状态栏沉浸色
    document.documentElement.onclick = function () {
        window.webapp.color(500);
    };
    document.documentElement.ontouchstart = function () {
        window.webapp.color(1000);
    };
    document.documentElement.onmousedown = function () {
        window.webapp.color(1000);
    };
});
// 设置相关
//
// 载入设置
function loadSettings() {
    // 默认设置
    if (localStorage.settings == undefined) {
        settings = { bootDirectory: "/storage/emulated/0/", showHidden: false, foldersFirst: true, itemsCount: false, showAnimation: true, translucentFAB: false, sortBy: "default" };
        localStorage.setItem("settings", JSON.stringify(settings));
    } else {
        settings = JSON.parse(localStorage.getItem("settings"));
    }
    // 填充设置列表
    document.querySelector("#set_bootDirectory").description = settings.bootDirectory;
    document.querySelector("#set_showHidden").checked = settings.showHidden ? "checked" : "";
    document.querySelector("#set_foldersFirst").checked = settings.foldersFirst ? "checked" : "";
    document.querySelector("#set_itemsCount").checked = settings.itemsCount ? "checked" : "";
    document.querySelector("#set_showAnimation").checked = settings.showAnimation ? "checked" : "";
    document.querySelector("#set_translucentFAB").checked = settings.translucentFAB ? "checked" : "";
    // 避免排序菜单未选中状态
    setTimeout(function () {
        document.querySelector("#set_sortBy").value = settings.sortBy;
    }, 0);
}
// 更新设置
function updateSettings() {
    // 防止设置回滚
    setTimeout(function () {
        settings.showHidden = document.querySelector("#set_showHidden").checked;
        settings.foldersFirst = document.querySelector("#set_foldersFirst").checked;
        settings.itemsCount = document.querySelector("#set_itemsCount").checked;
        settings.showAnimation = document.querySelector("#set_showAnimation").checked;
        settings.translucentFAB = document.querySelector("#set_translucentFAB").checked;
        settings.sortBy = document.querySelector("#set_sortBy").value;
        localStorage.setItem("settings", JSON.stringify(settings));
    }, 0);
}
// 更改设置
function changeSettings(key, value) {
    switch (key) {
        case "bootDirectory":
            // 启动目录
            settings.bootDirectory = value;
            localStorage.setItem("settings", JSON.stringify(settings));
            loadSettings();
            break;
        case "sortBy":
            // 排序方式
            settings.sortBy = value;
            localStorage.setItem("settings", JSON.stringify(settings));
            loadSettings();
            refreshFileList();
            break;
        default:
            break;
    }
}
// 长按菜单
var longPressTimeout;
// 鼠标或触摸点按下时，开始计时
function onTouchStart(item, isFromDrawer = false) {
    // 避免重复监听
    clearTimeout(longPressTimeout);
    longPressTimeout = setTimeout(function () {
        // 区分文件列表和书签列表
        if (isFromDrawer) {
            selectedBookmark = item;
            document.querySelector("#deleteBookmarkDialog").open = true;
            document.querySelector("#deleteBookmarkDialog").description = "要移除书签“" + document.querySelectorAll(".bookmark-list-item")[item].headline + "”吗？";
        } else {
            selected = item.headline;
            selectedIcon = item.icon;
            document.querySelector('#itemMenuDialog').open = true;
            document.querySelector('#itemMenuDialog').description = "对”" + item.headline + "“进行操作：";
        }
    }, 500);
}
// 鼠标或触摸点移动时，停止计时
function onTouchMove() {
    clearTimeout(longPressTimeout);
}
// 鼠标或触摸点释放时，停止计时
function onTouchEnd() {
    clearTimeout(longPressTimeout);
}
// 文件浏览相关
//
// 载入文件列表
function loadFiles(path) {
    try {
        // 获取并分割出文件列表
        var files = window.webapp.listfile(path).split("\\");
        // 初始化文件列表的 HTML 代码
        var html = "";
        // 排序
        switch (settings.sortBy) {
            case "default_reverse":
                // 默认-降序
                files = files.reverse();
                break;
            case "name":
                // 名称
                files = files.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                break;
            case "name_reverse":
                // 名称-降序
                files = files.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }).reverse();
                break;
            default:
                break;
        }
        // 文件夹在前
        if (settings.foldersFirst) {
            var folders_only = [];
            var files_only = [];
            files.forEach(function (item) {
                if (item.indexOf("/") == -1) {
                    files_only.push(item);
                } else {
                    folders_only.push(item);
                }
            });
            files = folders_only;
            files_only.forEach(function (item) {
                files.push(item);
            });
        }
        if (path != "/") {
            // 非根目录下显示上级目录
            var pathCopy = path.slice(0, path.length - 2);
            html += `<mdui-list-item rounded headline=".." icon="drive_folder_upload" onclick="openItem('` + (pathCopy.slice(0, pathCopy.lastIndexOf("/") + 1)) + `');"></mdui-list-item>`;
        }
        // 判断当前目录是否为空
        if (files != "/" && files != ",") {
            files.forEach(function (item) {
                // 判断是否为隐藏项目
                if (!(item[0] == "." && !settings.showHidden)) {
                    html += `<mdui-list-item rounded headline="` + item.replace("/", "") + `" type="` + (item.indexOf("/") != -1 ? "folder" : "file") + `" onclick="openItem('` + (path + item) + `');" class="file-list-item"></mdui-list-item>`;
                }
            });
        }
        // 动画效果
        document.querySelector("#fileList").style.opacity = settings.showAnimation ? "0" : "1";
        setTimeout(function () {
            // 填入文件列表的 HTML 代码
            document.querySelector("#fileList").innerHTML = html;
            if (document.querySelectorAll(".file-list-item").length == 0) {
                document.querySelector("#fileList").innerHTML += `<div style="text-align: center;margin: 16px 0;" id="noFileListItem">没有项目</div>`;
            }
            // 显示当前路径
            document.querySelector("#path").innerText = path;
            document.querySelector("#fileList").style.opacity = "1";
            document.querySelectorAll(".file-list-item").forEach(function (item) {
                // 判断是否为文件夹
                if (item.getAttribute("type") == "folder") {
                    // 为文件夹添加图标
                    item.icon = "folder";
                    if (settings.itemsCount) {
                        // 统计文件夹子项目数
                        var childItem = window.webapp.listfile(document.querySelector("#path").innerText + item.headline);
                        // 跳过无法读取的文件夹
                        if (childItem != undefined) {
                            var childItemArray = childItem.split("\\");
                            if (childItem == "/") {
                                item.description = "空文件夹";
                            } else {
                                item.description = childItemArray.length + " 个项目";
                            }
                        }
                    }
                } else {
                    // 为文件添加默认图标
                    item.icon = "insert_drive_file";
                    // 从文件名获取后缀
                    var fileName = item.headline;
                    var fileType = fileName.slice(item.headline.lastIndexOf(".") + 1, fileName.length);
                    // 根据文件后缀名设置新的图标
                    icons.forEach(function (iconItem) {
                        if (iconItem.match.split(",").indexOf(fileType.toLowerCase()) != -1) {
                            item.icon = iconItem.icon;
                        }
                    });
                }
                // 长按菜单
                // 触摸屏
                item.ontouchstart = function () { onTouchStart(item); touchScreen = true; };
                item.ontouchmove = function () { if (touchScreen) { onTouchMove(); } };
                item.ontouchend = function () { if (touchScreen) { onTouchEnd(); } };
                // 鼠标
                item.onmousedown = function () { onTouchStart(item); touchScreen = false; };
                item.onmousemove = function () { if (!touchScreen) { onTouchMove(); } };
                item.onmouseup = function () { if (!touchScreen) { onTouchEnd(); } };
            });
        }, settings.showAnimation ? 250 : 0);
        localStorage.setItem("lastPath", path);
    } catch (error) {
        // 捕获到异常时用 Snackbar 提示
        document.querySelector("#error").innerText = "未能载入项目列表：\n" + error;
        document.querySelector("#error").open = true;
        document.querySelector("#loadingFiles").innerText = "没有项目";
    }
    // 检测 FAB 透明度设置
    document.querySelector("#FAB").style.opacity = settings.translucentFAB ? "0.8" : "1";
}
// 打开项目
function openItem(item) {
    // 判断是否为文件夹
    if (item[item.length - 1] == "/") {
        loadFiles(item);
    } else {
        try {
            window.webapp.openfile(item);
        } catch (error) {
            // 捕获到异常时用 Snackbar 提示
            document.querySelector("#error").innerText = "未能打开文件：\n" + error;
            document.querySelector("#error").open = true;
        }
    }
}
// 高亮项目
function highlightItem(target) {
    // 记录成功状态
    var success = false;
    // 查找要高亮的项目
    document.querySelectorAll(".file-list-item").forEach(function (item) {
        if (item.headline == target) {
            success = true;
            // 激活列表项
            item.active = "active";
            // 滚动到该项目
            document.querySelector("mdui-layout-main").scrollTo(0, item.offsetTop);
        }
    });
    // 定位失败时用 Snackbar 提示
    if (!success) {
        document.querySelector("#failedToLocate").open = true;
    }
}
// 搜索项目
function searchItem() {
    // 获取关键词
    var keyword = document.querySelector("#searchKeyword").value;
    // 判断是否区分大小写
    var matchCase = document.querySelector("#searchMatchCase").checked;
    // 搜索结果计数
    var searchResults = 0;
    if (keyword == "") {
        // 关键词为空时显示所有项目
        document.querySelectorAll(".file-list-item").forEach(function (item) {
            item.style.display = "block";
            searchResults++;
        });
    } else {
        // 查找项目
        if (matchCase) {
            document.querySelectorAll(".file-list-item").forEach(function (item) {
                if (item.headline.indexOf(keyword) == -1) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";
                    searchResults++;
                }
            });
        } else {
            document.querySelectorAll(".file-list-item").forEach(function (item) {
                if (item.headline.toLowerCase().indexOf(keyword.toLowerCase()) == -1) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";
                    searchResults++;
                }
            });
        }
    }
    // 搜索无结果提示
    if (searchResults == 0) {
        if (document.querySelectorAll("#noFileListItem").length != 0) {
            document.querySelector("#noFileListItem").style.display = "block";
        } else {
            document.querySelector("#fileList").innerHTML += `<div style="text-align: center;margin: 16px 0;" id="noFileListItem">没有项目</div>`;
        }
    } else if (document.querySelectorAll("#noFileListItem").length != 0) {
        document.querySelector("#noFileListItem").style.display = "none";
    }
    if (document.querySelectorAll("#loadingFiles").length != 0) {
        document.querySelector("#loadingFiles").style.display = "none";
    }
    document.querySelector('#searchItemDialog').open = false;
}
// 跳转到指定目录（并定位到项目）
function setPath() {
    // 获取输入的路径
    var path = document.querySelector("#pathInput").value;
    if (path == "") {
        // 路径为空时要求填写
        document.querySelector('#invalidPath').open = true;
        document.querySelector("#pathInput").focus();
    } else {
        document.querySelector('#setPathDialog').open = false;
        // 避免对话框关闭动画卡顿
        setTimeout(function () {
            // 判断是否为文件夹
            if (path[path.length - 1] == "/") {
                loadFiles(path);
            } else {
                loadFiles(path.slice(0, path.lastIndexOf("/") + 1));
                // 避免错误高亮
                if (window.webapp.listfile(path.slice(0, path.lastIndexOf("/") + 1)) != undefined) {
                    // 文件列表载入完成后高亮文件
                    setTimeout(function () {
                        highlightItem(path.slice(path.lastIndexOf("/") + 1, path.length));
                    }, 300);
                }
            }
        }, 250);
    }
}
// 打开抽屉栏中的文件夹 / 定位到抽屉栏中的文件
function openDrawerItem(item) {
    // 获取页面宽度
    var pageWidth = document.documentElement.clientWidth;
    // 响应式隐藏抽屉栏
    if (pageWidth < 840) {
        document.querySelector("#drawer").open = false;
    }
    // 避免抽屉栏关闭动画卡顿
    setTimeout(function () {
        loadFiles(item.slice(0, item.lastIndexOf("/") + 1));
        // 自动高亮文件
        if (item[item.length - 1] != "/") {
            // 等待文件列表载入完成再执行
            setTimeout(function () {
                highlightItem(item.slice(item.lastIndexOf("/") + 1, item.length));
            }, 300);
        }
    }, pageWidth < 840 ? 250 : 0);
}
// 根据文件后缀名匹配图标
icons = [
    { match: "bmp,gif,ico,jpeg,jpg,png,svg,tiff,webp,psd", icon: "image" },
    { match: "mp3,wav,aac,m4a,ogg,webm,aiff,aif,aifc,flac,ape,mid", icon: "music_note" },
    { match: "mp4,3gp,avi,wmv,asf,mpeg,mpg,mpe,ts,mov,flv,swf,mpg,dat,flc", icon: "movie" },
    { match: "pdf", icon: "picture_as_pdf" },
    { match: "txt,doc,docx,log,md", icon: "description" },
    { match: "xls,xlsx,xlsm,xlsb,csv", icon: "table_view" },
    { match: "ppt,pptx,pptm,pot,pps,ppa", icon: "pie_chart" },
    { match: "bak", icon: "settings_backup_restore" },
    { match: "zip,rar,tar,gz,tgz,bz2,7z,xz,jar", icon: "folder_zip" },
    { match: "vdi,vhd,vmdk,vhdx,img,dmg,qcow,qcow2", icon: "save" },
    { match: "iso", icon: "album" },
    { match: "nomedia", icon: "music_off" },
    { match: "apk,apkm,xapk,apks,obb", icon: "android" },
    { match: "exe,com,appimage", icon: "computer" },
    { match: "msi,inf,deb,rpm", icon: "install_desktop" },
    { match: "bat,cmd,ps1,sh,xml,html,css,js,php,json,vbs,vba,h,c,java,class,py,mhtml,mht,inc", icon: "code" },
    { match: "cfg,config,ini,dll,lib,so", icon: "settings" },
    { match: "ipa,app,sis,sisx", icon: "install_mobile" },
    { match: "db,mdb,accdb,dbf,sql,sqlite,db3,mdf,myd,wdb", icon: "storage" },
    { match: "crdownload", icon: "downloading" },
    { match: "themes,msstyles", icon: "style" },
    { match: "vcf", icon: "contacts" },
    { match: "prop", icon: "info" },
    { match: "pem,der,cer,crt,key,csr,p12,0", icon: "vpn_key" },
    { match: "ttf,otf,woff,woff2,eot", icon: "text_fields" },
    { match: "crx", icon: "extension" }
];
// 文件操作相关
//
// 新建项目
function newItem() {
    // 获取项目类型和名称
    var type = document.querySelector("#newItemType").value;
    var name = document.querySelector("#newItemName").value;
    // 检查是否存在同名项目
    var itemExists = false;
    document.querySelectorAll(".file-list-item").forEach(function (item) {
        if (item.headline.toLowerCase() == document.querySelector("#newItemName").value.toLowerCase()) {
            itemExists = true;
        }
    });
    if (type == "") {
        // 类型为空时要求选择
        document.querySelector("#invalidItemType").open = true;
    } else if (name == "") {
        // 名称为空时要求填写
        document.querySelector("#invalidItemName").open = true;
        document.querySelector("#newItemName").focus();
    } else if (itemExists) {
        // 存在同名项目时要求修改名称
        document.querySelector("#itemExists").open = true;
        document.querySelector("#newItemName").focus();
    } else if (name.indexOf("/") != -1) {
        // 名称存在非法字符时要求修改
        document.querySelector("#illegalCharacter").open = true;
        document.querySelector("#newItemName").focus();
    } else {
        if (type == "folder") {
            // 新建文件夹
            window.webapp.savefile(document.querySelector("#path").innerText + name, null);
            // 检查新建是否成功
            if (window.webapp.stayfile(document.querySelector("#path").innerText + name)) {
                document.querySelector("#created").open = true;
                // 避免对话框关闭动画卡顿
                setTimeout(function () {
                    // 自动进入该文件夹
                    openItem(document.querySelector("#path").innerText + name + "/");
                }, 250);
            } else {
                document.querySelector("#failedToCreate").open = true;
            }
        } else {
            // 新建文件
            window.webapp.savefile(document.querySelector("#path").innerText + name, "");
            // 检查新建是否成功
            if (window.webapp.stayfile(document.querySelector("#path").innerText + name)) {
                document.querySelector("#created").open = true;
                // 避免对话框关闭动画卡顿
                setTimeout(function () {
                    refreshFileList();
                    setTimeout(function () {
                        // 高亮该文件
                        highlightItem(name);
                    }, 300);
                }, 250);
            } else {
                document.querySelector("#failedToCreate").open = true;
            }
        }
        document.querySelector("#newItemDialog").open = false;
    }
}
// 复制项目完整路径
function copyItemPath() {
    copyHandle(document.querySelector("#path").innerText + selected);
    document.querySelector("#itemMenuDialog").open = false;
}
// 重命名项目
function renameItem(isFinalStep = false) {
    // 获取新的名称
    var name = document.querySelector("#renameItemName").value;
    if (isFinalStep) {
        // 最终操作
        // 检查是否存在同名项目
        var itemExists = false;
        document.querySelectorAll(".file-list-item").forEach(function (item) {
            if (item.headline.toLowerCase() == name.toLowerCase()) {
                itemExists = true;
            }
        });
        if (name == "") {
            // 名称为空时要求填写
            document.querySelector("#invalidRenameItemName").open = true;
            document.querySelector("#renameItemName").focus();
        } else if (itemExists) {
            // 存在同名项目时要求修改名称
            document.querySelector("#itemExists").open = true;
            document.querySelector("#renameItemName").focus();
        } else if (name.indexOf("/") != -1) {
            // 名称存在非法字符时要求修改
            document.querySelector("#illegalCharacter").open = true;
            document.querySelector("#renameItemName").focus();
        } else {
            window.webapp.namefile(document.querySelector("#path").innerText + selected, name);
            // 检查重命名是否成功
            if (window.webapp.stayfile(document.querySelector("#path").innerText + name)) {
                document.querySelector("#renamed").open = true;
                // 避免对话框关闭动画卡顿
                setTimeout(function () {
                    refreshFileList();
                    setTimeout(function () {
                        // 高亮该文件
                        highlightItem(name);
                    }, 300);
                }, 250);
            } else {
                document.querySelector("#failedToRename").open = true;
            }
            document.querySelector("#renameItemDialog").open = false;
        }
    } else {
        document.querySelector("#itemMenuDialog").open = false;
        document.querySelector("#renameItemDialog").open = true;
        // 填入项目旧名称
        document.querySelector("#renameItemDialog").description = "重命名 “" + selected + "”：";
        document.querySelector("#renameItemName").value = selected;
    }
}
// 删除项目
function deleteItem(isFinalStep = false) {
    if (isFinalStep) {
        // 最终操作
        window.webapp.awayfile(document.querySelector("#path").innerText + selected);
        // 检查删除是否成功
        if (window.webapp.stayfile(document.querySelector("#path").innerText + selected)) {
            document.querySelector("#failedToDelete").open = true;
        } else {
            document.querySelector("#deleted").open = true;
            // 避免对话框关闭动画卡顿
            setTimeout(function () {
                refreshFileList();
            }, 250);
        }
        document.querySelector("#deleteItemDialog_2").open = false;
    } else {
        document.querySelector("#itemMenuDialog").open = false;
        document.querySelector("#deleteItemDialog").open = true;
        // 填入项目名称
        document.querySelector("#deleteItemDialog").description = "要删除 “" + selected + "”吗？";
        document.querySelector("#deleteItemDialog_2").description = "请再次确认以删除 “" + selected + "”。";
    }
}
// 书签相关
//
// 获取书签
function loadBookmarks() {
    if (localStorage.bookmark == undefined) {
        // 初始化书签列表
        bookmark = [];
    } else {
        // 获取存储的书签
        bookmark = JSON.parse(localStorage.getItem("bookmark"));
    }
    // 判断是否已有书签
    if (bookmark.length == 0) {
        document.querySelector("#bookmarkText").innerText = "没有添加任何书签";
        document.querySelector("#bookmark").innerHTML = "";
    } else {
        document.querySelector("#bookmarkText").innerText = "书签";
        // 初始化书签列表的 HTML 代码
        var html = "";
        bookmark.forEach(function (item) {
            html += `<mdui-list-item rounded icon="` + item.icon + `" headline="` + item.headline + `" description="` + item.description + `" onclick="openDrawerItem('` + (item.description + item.headline) + (item.icon == "folder" ? "/" : "") + `');" class="bookmark-list-item"></mdui-list-item>`;
        });
        // 填入书签列表的 HTML 代码
        document.querySelector("#bookmark").innerHTML = html;
        // 长按菜单
        document.querySelectorAll(".bookmark-list-item").forEach(function (item, index) {
            // 触摸屏
            item.ontouchstart = function () { onTouchStart(index, true); touchScreen = true; };
            item.ontouchmove = function () { if (touchScreen) { onTouchMove(); } };
            item.ontouchend = function () { if (touchScreen) { onTouchEnd(); } };
            // 鼠标
            item.onmousedown = function () { onTouchStart(index, true); touchScreen = false; };
            item.onmousemove = function () { if (!touchScreen) { onTouchMove(); } };
            item.onmouseup = function () { if (!touchScreen) { onTouchEnd(); } };
        })
    }
}
// 添加书签
function addBookmark(isCurrentPath = false) {
    // 判断是否为当前目录添加书签
    if (isCurrentPath) {
        // 获取当前路径
        var path = document.querySelector("#path").innerText;
        // 判断路径是否为空
        if (path == "") {
            document.querySelector("#failedToGetPath").open = true;
        } else {
            path = path.slice(0, path.length - 1);
            bookmark.push({ icon: "folder", headline: path.slice(path.lastIndexOf("/") + 1, path.length), description: path.slice(0, path.lastIndexOf("/") + 1) });
            localStorage.setItem("bookmark", JSON.stringify(bookmark));
            document.querySelector("#addedBookmark").open = true;
            loadBookmarks();
        }
    } else {
        bookmark.push({ icon: selectedIcon, headline: selected, description: document.querySelector("#path").innerText });
        localStorage.setItem("bookmark", JSON.stringify(bookmark));
        document.querySelector("#addedBookmark").open = true;
        document.querySelector("#itemMenuDialog").open = false;
        loadBookmarks();
    }
}
// 移除书签
function removeBookmark() {
    bookmark.splice(selectedBookmark, 1);
    localStorage.setItem("bookmark", JSON.stringify(bookmark));
    document.querySelector("#removedBookmark").open = true;
    document.querySelector("#deleteBookmarkDialog").open = false;
    loadBookmarks();
}
// 批量操作相关
//
// 批量选择
function multipleSelect(option) {
    switch (option) {
        case "selectAll":
            // 全选
            document.querySelectorAll("*[name='multipleSelectCheckbox']").forEach(function (item) {
                item.checked = true;
            });
            break;
        case "selectInverse":
            // 反选
            document.querySelectorAll("*[name='multipleSelectCheckbox']").forEach(function (item) {
                item.checked = item.checked ? false : true;
            });
            break;
        case "cancelAll":
            // 取消全选
            document.querySelectorAll("*[name='multipleSelectCheckbox']").forEach(function (item) {
                item.checked = false;
            });
            break;
        default:
            break;
    }
}
// 批量操作
function multipleOperate(option, isFinalStep = false) {
    // 初始化批量操作文件列表
    multipleSelected = [];
    document.querySelectorAll("*[name='multipleSelectCheckbox']").forEach(function (item, index) {
        if (item.checked) {
            multipleSelected.push(document.querySelectorAll(".multiple-select-list-item")[index].headline);
        }
    });
    if (multipleSelected.length == 0) {
        // 未选中任何项目时弹出 Snackbar
        document.querySelector("#noSelected").open = true;
    } else {
        switch (option) {
            case "delete":
                // 删除选中的项目
                if (isFinalStep) {
                    // 最终操作
                    document.querySelector("#multipleOperationStatus").innerText = "正在删除" + multipleSelected.length + "个项目";
                    document.querySelector("#multipleOperationStatus").open = true;
                    multipleSelected.forEach(function (item) {
                        window.webapp.awayfile(document.querySelector("#path").innerText + item);
                    });
                    // 删除失败计数
                    var failed = 0;
                    multipleSelected.forEach(function (item) {
                        if (window.webapp.stayfile(document.querySelector("#path").innerText + item)) {
                            failed++;
                        }
                    });
                    if (failed == 0) {
                        var snackbarText = "已删除" + (multipleSelected.length - failed) + "个项目";
                    } else if (failed == multipleSelected.length) {
                        var snackbarText = "未能删除" + failed + "个项目";
                    } else {
                        var snackbarText = "已删除" + (multipleSelected.length - failed) + "个项目，未能删除" + failed + "个项目";
                    }
                    document.querySelector("#multipleOperationStatus").innerText = snackbarText;
                    document.querySelector("#multipleOperationStatus").open = true;
                    document.querySelector('#multipleDeleteDialog_2').open = false;
                    // 避免对话框关闭动画卡顿
                    setTimeout(function () {
                        refreshFileList();
                    }, 250);
                } else {
                    document.querySelector('#multipleSelectDialog').open = false;
                    document.querySelector('#multipleDeleteDialog').open = true;
                    // 填入项目数量
                    document.querySelector('#multipleDeleteDialog').description = "要删除选中的" + multipleSelected.length + "个项目吗？";
                    document.querySelector('#multipleDeleteDialog_2').description = "请再次确认以删除选中的" + multipleSelected.length + "个项目。";
                }
                break;
            default:
                break;
        }
    }
}
// 其他功能
//
// 复制文本
function copyHandle(content) {
    let copy = (e) => {
        e.preventDefault()
        e.clipboardData.setData('text/plain', content)
        document.removeEventListener('copy', copy)
    }
    document.addEventListener('copy', copy)
    document.execCommand("Copy");
    document.getElementById("copied").open = true;
}
// 刷新文件列表
function refreshFileList() {
    loadFiles(document.querySelector("#path").innerText);
}