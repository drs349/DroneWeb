TargetC_DEET=1e-3;
TargetC_Transflutherin=1e-3;

%% there are two methods essentially in use.
%   I reccomend Method 2 for testing as it has the simple input of chem, time
%       to last, and Temperature

%% method 1
function r = calcR(D_0, time, temp, targetC)

M=1e-12;
D=D_0*temp^(1.5)/(298^1.5);
C=targetC;

t=(0:60*60:60*60*24*60)';
r=zeros(length(t),1);
n=zeros(length(t),1);


for i=2:length(t)
    aux=1;
    s=0;
    while aux-r(i)>1e-2
        r(i)=M/(2*pi*D*C)*erfc(aux/(2*sqrt(D*t(i))));
        aux=r(i);

        s=s+1;
        if s==100
            break
        end
    end
    n(i)=s;
end

%% Method 2
function [D, M, C] = getChemData(chem)
switch chem
    case 'DEET'
        M=3.7*10^-8;                %g/s
        D=1.11*10^-6;               %m^2/s
        C=TargetC_DEET;             %g/m^3

    case 'Trans'
        M=1.14e-9;                  %g/s
        D=1.11*10^-7;               %m^2/s
        C=TargetC_Transflutherin;   %g/m^3
end

function r = calcR2(chem,time,T)
[D, M, C] = getChemData(chem);
setappdata(0, 'chemdata', [D, M, C]);
t=(0:60*60:60*60*24*time)';
r=zeros(length(t),1);
n=zeros(length(t),1);

D=D*T^(3/2)/293^(3/2);
setappdata(0, 'chemdata1', [D, M, C]);

for i=2:length(t)
    aux=1;
    s=0;
    while aux-r(i)>1e-2
        r(i)=M/(2*pi*D*C)*erfc(aux/(2*sqrt(D*t(i))));
        aux=r(i);

        s=s+1;
        if s==100
            break
        end
    end
    n(i)=s;
end
a = size(r(:,1));
r= r(a(1));
setappdata(0, 'radius', r);