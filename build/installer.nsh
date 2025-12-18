; NSIS 安装脚本自定义配置

!macro customInstall
  ; 创建卸载注册表项
  WriteRegStr HKCU "Software\TemuWorkbench" "InstallPath" "$INSTDIR"
  
  ; 设置文件关联（可选）
  ; WriteRegStr HKCR ".stp" "" "TemuWorkbench.Project"
  ; WriteRegStr HKCR "TemuWorkbench.Project" "" "Temu工作台 Project File"
  ; WriteRegStr HKCR "TemuWorkbench.Project\DefaultIcon" "" "$INSTDIR\Temu工作台.exe,0"
!macroend

!macro customUnInstall
  ; 清理注册表
  DeleteRegKey HKCU "Software\TemuWorkbench"
  
  ; 清理文件关联
  ; DeleteRegKey HKCR ".stp"
  ; DeleteRegKey HKCR "TemuWorkbench.Project"
!macroend

!macro preInit
  ; 安装前检查
  SetShellVarContext current
  
  ; 检查是否已安装
  ReadRegStr $0 HKCU "Software\TemuWorkbench" "InstallPath"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION "检测到已安装的 Temu工作台。$\n$\n是否要覆盖安装？" IDYES +2
    Abort
  ${EndIf}
!macroend

!macro customHeader
  !system "echo 'Building Temu工作台 Installer...'"
!macroend

